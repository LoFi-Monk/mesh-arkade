import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleUnmount } from "../../commands/unmount.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi
    .fn()
    .mockReturnValue({ socketPath: "/test.sock", storagePath: "/test" }),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleUnmount", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should show usage error when path is missing", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleUnmount("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Usage: unmount <path>");
    consoleLog.mockRestore();
  });

  it("should call hub.handleRequest with curator:unmount", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({ result: { success: true } });
    await handleUnmount("/test/lib", mockHub, {
      isJson: false,
      isSilent: false,
    });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curator:unmount",
      params: { path: "/test/lib" },
    });
  });

  it("should output success message on success", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({ result: { success: true } });
    await handleUnmount("/test/lib", mockHub, {
      isJson: false,
      isSilent: false,
    });
    expect(consoleLog).toHaveBeenCalledWith("Unmounted: /test/lib");
    consoleLog.mockRestore();
  });

  it("should output JSON error when path missing in JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleUnmount("", mockHub, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(
      '{"error":"Missing path argument"}',
    );
    consoleLog.mockRestore();
  });

  it("should output error when hub returns error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      error: { message: "Not found" },
    });
    await handleUnmount("/test/lib", mockHub, {
      isJson: false,
      isSilent: false,
    });
    expect(consoleLog).toHaveBeenCalledWith("Error: Not found");
    consoleLog.mockRestore();
  });

  it("should output JSON result in JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { unmounted: true },
    });
    await handleUnmount("/test/lib", mockHub, {
      isJson: true,
      isSilent: false,
    });
    expect(consoleLog).toHaveBeenCalledWith('{"unmounted":true}');
    consoleLog.mockRestore();
  });

  it("should handle exception from hub", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockRejectedValueOnce(new Error("Exception"));
    await handleUnmount("/test/lib", mockHub, {
      isJson: false,
      isSilent: false,
    });
    expect(consoleLog).toHaveBeenCalledWith("Error: Exception");
    consoleLog.mockRestore();
  });
});
