import { describe, it, expect, vi, beforeEach } from "vitest";
import { runFirstRunWizard } from "../wizard.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("runFirstRunWizard", () => {
  let mockHub: ReturnType<typeof createMockHub>;
  let mockRl: {
    question: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHub = createMockHub();
    mockRl = {
      question: vi.fn(),
      close: vi.fn(),
    };
  });

  it("should handle empty path input", async () => {
    mockRl.question.mockImplementation((_query, cb) => cb(""));
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await runFirstRunWizard(mockRl as any, mockHub);
    expect(mockHub.handleRequest).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it("should mount library when path provided", async () => {
    mockRl.question.mockImplementation((_query, cb) => cb("/test/library"));
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { fileCount: 100 },
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await runFirstRunWizard(mockRl as any, mockHub);
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curator:mount",
      params: { path: "/test/library" },
    });
    consoleLog.mockRestore();
  });

  it("should show success message on mount", async () => {
    mockRl.question.mockImplementation((_query, cb) => cb("/test/library"));
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { fileCount: 100 },
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await runFirstRunWizard(mockRl as any, mockHub);
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Success!");
    consoleLog.mockRestore();
  });

  it("should handle mount error", async () => {
    mockRl.question.mockImplementation((_query, cb) => cb("/test/library"));
    mockHub.handleRequest.mockResolvedValueOnce({
      error: { message: "Invalid path" },
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await runFirstRunWizard(mockRl as any, mockHub);
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Error:");
    consoleLog.mockRestore();
  });
});
