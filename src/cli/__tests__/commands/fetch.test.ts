import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFetch } from "../../commands/fetch.js";
import { FetchLayerError } from "../../../fetch/errors.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi
    .fn()
    .mockReturnValue({ socketPath: "/test.sock", storagePath: "/test" }),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleFetch", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHub = createMockHub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("No SHA1 argument: prints usage", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleFetch("", mockHub, { isSilent: false, isJson: false });
    expect(consoleLog).toHaveBeenCalledWith("Usage: fetch <sha1>");
    consoleLog.mockRestore();
  });

  it("No SHA1 argument in JSON mode: outputs JSON error", async () => {
    const outputModule = await import("../../formatter.js");
    const outputSpy = vi
      .spyOn(outputModule, "output")
      .mockImplementation(() => {});
    await handleFetch("", mockHub, { isSilent: false, isJson: true });
    expect(outputSpy).toHaveBeenCalledWith(
      { error: "Usage: fetch <sha1>" },
      { isSilent: false, isJson: true },
    );
    outputSpy.mockRestore();
  });

  it("Invalid SHA1 (not 40 hex): outputs error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleFetch("invalid-sha1", mockHub, {
      isSilent: false,
      isJson: false,
    });
    expect(consoleLog).toHaveBeenCalledWith(
      "Error: Invalid SHA1: must be exactly 40 hexadecimal characters. Got: invalid-sha1",
    );
    consoleLog.mockRestore();
  });

  it("No library mounted: outputs error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValue({ result: [], error: null });
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, {
      isSilent: false,
      isJson: false,
    });
    expect(consoleLog).toHaveBeenCalledWith(
      "Error: No library mounted. Run 'mount' first to add a library.",
    );
    consoleLog.mockRestore();
  });

  it("No active mount: outputs error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValue({
      result: [{ path: "/test/path", status: "inactive" }],
      error: null,
    });
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, {
      isSilent: false,
      isJson: false,
    });
    expect(consoleLog).toHaveBeenCalledWith(
      "Error: No active library mounted. Run 'mount' first to add a library.",
    );
    consoleLog.mockRestore();
  });

  it("hub.handleRequest returns error: outputs error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValue({
      result: null,
      error: { message: "Hub error" },
    });
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, {
      isSilent: false,
      isJson: false,
    });
    expect(consoleLog).toHaveBeenCalledWith("Error: Hub error");
    consoleLog.mockRestore();
  });

  it("isSilent=true with no mount: suppresses mount error (still shows error)", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValue({ result: [], error: null });
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, {
      isSilent: true,
      isJson: false,
    });
    expect(consoleLog).toHaveBeenCalledWith(
      "Error: No library mounted. Run 'mount' first to add a library.",
    );
    consoleLog.mockRestore();
  });

  it("lookupResult.error with isSilent=true: does not warn", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValue({
      result: null,
      error: { message: "Lookup failed" },
    });
    await handleFetch("abc123def456789012345678901234567890abcd", mockHub, {
      isSilent: true,
      isJson: false,
    });
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleLog.mockRestore();
    consoleWarn.mockRestore();
  });
});
