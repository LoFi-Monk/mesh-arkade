import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMount } from "../../commands/mount.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi
    .fn()
    .mockReturnValue({ socketPath: "/test.sock", storagePath: "/test" }),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleMount", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should show usage error when path is missing", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleMount("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Usage: mount <path>");
    consoleLog.mockRestore();
  });

  it("should show JSON error when path is missing and isJson is true", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleMount("", mockHub, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(
      '{"error":"Missing path argument"}',
    );
    consoleLog.mockRestore();
  });

  it("should call hub.handleRequest with curator:mount", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { path: "/test/lib", fileCount: 100 },
    });
    await handleMount("/test/lib", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curator:mount",
      params: { path: "/test/lib" },
    });
  });

  it("should output success message on success", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { path: "/test/lib", fileCount: 100 },
    });
    await handleMount("/test/lib", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Mounted: /test/lib");
    expect(consoleLog).toHaveBeenCalledWith("  Files: 100");
    consoleLog.mockRestore();
  });

  it("should output JSON result when isJson is true", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = { path: "/test/lib", fileCount: 100 };
    mockHub.handleRequest.mockResolvedValueOnce({ result });
    await handleMount("/test/lib", mockHub, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(JSON.stringify(result));
    consoleLog.mockRestore();
  });

  it("should output error when hub returns error", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      error: { message: "Invalid path" },
    });
    await handleMount("/invalid", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Invalid path");
    consoleLog.mockRestore();
  });

  it("should handle exceptions", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockRejectedValueOnce(new Error("Network error"));
    await handleMount("/test", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Network error");
    consoleLog.mockRestore();
  });
});
