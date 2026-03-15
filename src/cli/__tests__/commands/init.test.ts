import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleInit } from "../../commands/init.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleInit", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should show usage error when system is missing", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleInit("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Usage: init --seed=<system-id>");
    consoleLog.mockRestore();
  });

  it("should accept --seed= flag", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { systemTitle: "NES", gamesAdded: 10, totalGames: 10 },
    });
    await handleInit("--seed=nes", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curation:seed",
      params: { system: "nes" },
    });
  });

  it("should accept positional argument", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { systemTitle: "NES", gamesAdded: 10, totalGames: 10 },
    });
    await handleInit("nes", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curation:seed",
      params: { system: "nes" },
    });
  });

  it("should output success message", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: { systemTitle: "NES", gamesAdded: 10, totalGames: 10 },
    });
    await handleInit("--seed=nes", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith("Successfully seeded NES");
    consoleLog.mockRestore();
  });
});
