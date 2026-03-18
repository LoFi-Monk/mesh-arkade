import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSystems } from "../../commands/systems.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleSystems", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should call hub.handleRequest with curation:systems", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleSystems("", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curation:systems",
    });
  });

  it("should output systems list in human mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: [
        { id: "nes", title: "NES" },
        { id: "snes", title: "SNES" },
      ],
    });
    await handleSystems("", mockHub, { isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("NES (nes)");
    expect(output).toContain("SNES (snes)");
    consoleLog.mockRestore();
  });

  it("should output JSON when isJson is true", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const systems = [{ id: "nes", title: "NES" }];
    mockHub.handleRequest.mockResolvedValueOnce({ result: systems });
    await handleSystems("", mockHub, { isJson: true, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(JSON.stringify(systems));
    consoleLog.mockRestore();
  });

  it("should output error when result.error is present", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      error: { message: "Test error message" },
    });
    await handleSystems("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Test error message");
    consoleLog.mockRestore();
  });

  it("should catch and output error when hub.handleRequest throws", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockRejectedValueOnce(new Error("Network failure"));
    await handleSystems("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Error: Network failure");
    consoleLog.mockRestore();
  });
});
