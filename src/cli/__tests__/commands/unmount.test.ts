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
});
