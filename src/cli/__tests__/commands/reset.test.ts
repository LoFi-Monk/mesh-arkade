import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleReset } from "../../commands/reset.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleReset", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should call hub.handleRequest with database:reset in JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({ result: { success: true } });
    await handleReset("", mockHub, { isJson: true, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "database:reset",
    });
    consoleLog.mockRestore();
  });

  it("should require rl in non-JSON mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleReset("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(
      "Error: Readline interface required for interactive confirmation",
    );
    consoleLog.mockRestore();
  });

  it("should handle confirmation yes", async () => {
    const mockRl = {
      question: vi.fn((_query, cb) => cb("y")),
      close: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      on: vi.fn(),
    };
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({ result: { success: true } });
    await handleReset("", mockHub, { isJson: false, isSilent: false }, mockRl);
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "database:reset",
    });
    consoleLog.mockRestore();
  });

  it("should handle confirmation no", async () => {
    const mockRl = {
      question: vi.fn((_query, cb) => cb("n")),
      close: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      on: vi.fn(),
    };
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleReset("", mockHub, { isJson: false, isSilent: false }, mockRl);
    expect(consoleLog).toHaveBeenCalledWith("  Reset cancelled.");
    expect(mockHub.handleRequest).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });
});
