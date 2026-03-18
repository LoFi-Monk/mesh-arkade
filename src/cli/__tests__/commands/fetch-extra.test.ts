import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFetch } from "../../commands/fetch.js";
import { FetchManager } from "../../../fetch/fetch-manager.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi
    .fn()
    .mockReturnValue({ socketPath: "/test.sock", storagePath: "/test" }),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

vi.mock("../../../fetch/fetch-manager.js", () => ({
  FetchManager: vi.fn().mockImplementation(() => ({
    fetchAndStage: vi.fn().mockResolvedValue("test.bin"),
    onProgress: vi.fn(),
  })),
}));

vi.mock("../../../core/runtime.js", () => ({
  getFs: vi.fn().mockResolvedValue({
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  }),
  getPath: vi.fn().mockResolvedValue({
    join: (...parts: string[]) => parts.join("/"),
  }),
}));

vi.mock("ora", () => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  };
  return {
    default: vi.fn(() => spinner),
  };
});

describe("handleFetch Extra Branches", () => {
  let consoleLog: any;
  let processExit: any;

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    processExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLog.mockRestore();
    processExit.mockRestore();
  });

  it("successful fetch without known record in museum map (uses generic 'ROM')", async () => {
    const mockHub = createMockHub();
    // 1st request: mounts list
    // 2nd request: lookup-sha1
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ result: null }); // Null = unknown game
    
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: false, isSilent: false });
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("test.bin"));
  });

  it("successful fetch with known record", async () => {
    const mockHub = createMockHub();
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ result: { title: "Super Mario" } }); 
    
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: false, isSilent: false });
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("test.bin"));
  });

  it("successful fetch with JSON output", async () => {
    const mockHub = createMockHub();
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ result: { title: "Super Mario" } }); 
    
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: true, isSilent: false });
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('"success":true'));
  });

  it("handles FetchManager error", async () => {
    const mockHub = createMockHub();
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ result: { title: "Super Mario" } }); 
    
    vi.mocked(FetchManager).mockImplementationOnce(() => ({
       fetchAndStage: vi.fn().mockRejectedValue(new Error("Fetch failed completely")),
       onProgress: vi.fn(),
    } as any));

    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: false, isSilent: false });
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("Fetch failed: Fetch failed completely"));
  });

  it("handles FetchManager error with isSilent and isJson", async () => {
    const mockHub = createMockHub();
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ result: { title: "Super Mario" } }); 
    
    vi.mocked(FetchManager).mockImplementationOnce(() => ({
       fetchAndStage: vi.fn().mockRejectedValue(new Error("Fetch failed completely")),
       onProgress: vi.fn(),
    } as any));

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: true, isSilent: true });
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('"error":"Fetch failed: Fetch failed completely"'));
    consoleError.mockRestore();
  });

  it("handles lookupResult.error without isSilent", async () => {
    const mockHub = createMockHub();
    mockHub.handleRequest
      .mockResolvedValueOnce({ result: [{ path: "/test", status: "active" }] })
      .mockResolvedValueOnce({ error: { message: "Lookup failed", code: 500 } }); 
    
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, { isJson: false, isSilent: false });
    
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining("Lookup failed"));
    consoleWarn.mockRestore();
  });
});