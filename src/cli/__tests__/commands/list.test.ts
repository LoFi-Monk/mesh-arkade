import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleListMounts } from "../../commands/list.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleListMounts", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should call hub.handleRequest with curator:list", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleListMounts("", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curator:list",
    });
  });

  it("should output empty message when no mounts", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleListMounts("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("No libraries mounted.");
    consoleLog.mockRestore();
  });

  it("should render table when mounts exist", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: [{ path: "/test/lib", status: "active", fileCount: 100 }],
    });
    await handleListMounts("", mockHub, { isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Mounted Libraries:");
    consoleLog.mockRestore();
  });

  it("should output JSON when isJson is true", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const mounts = [{ path: "/test/lib", status: "active", fileCount: 100 }];
    mockHub.handleRequest.mockResolvedValueOnce({ result: mounts });
    await handleListMounts("", mockHub, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(JSON.stringify(mounts));
    consoleLog.mockRestore();
  });

  it("should handle hub error response", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      error: { message: "Hub error" },
    });
    await handleListMounts("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Hub error");
    consoleLog.mockRestore();
  });

  it("should handle exception from hub", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockRejectedValueOnce(new Error("Exception"));
    await handleListMounts("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Exception");
    consoleLog.mockRestore();
  });
});
