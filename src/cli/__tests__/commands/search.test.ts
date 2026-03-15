import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearch } from "../../commands/search.js";

const createMockHub = (overrides = {}) => ({
  handleRequest: vi.fn(),
  getStatus: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

describe("handleSearch", () => {
  let mockHub: ReturnType<typeof createMockHub>;

  beforeEach(() => {
    mockHub = createMockHub();
  });

  it("should show usage when query and system are missing", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await handleSearch("", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith(
      "Usage: search <query> [--system=<id>]",
    );
    consoleLog.mockRestore();
  });

  it("should call hub.handleRequest with curation:search", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleSearch("mario", mockHub, { isJson: false, isSilent: false });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curation:search",
      params: { query: "mario", system: undefined, limit: 20 },
    });
  });

  it("should accept --system flag", async () => {
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleSearch("--system=nes", mockHub, {
      isJson: false,
      isSilent: false,
    });
    expect(mockHub.handleRequest).toHaveBeenCalledWith({
      method: "curation:search",
      params: { query: "", system: "nes", limit: 20 },
    });
  });

  it("should output no results message when empty", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({ result: [] });
    await handleSearch("mario", mockHub, { isJson: false, isSilent: false });
    expect(consoleLog).toHaveBeenCalledWith('No results found for "mario"');
    consoleLog.mockRestore();
  });

  it("should render results in human mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockHub.handleRequest.mockResolvedValueOnce({
      result: [
        { title: "Super Mario Bros.", sha1: "abc123def", region: "USA" },
      ],
    });
    await handleSearch("mario", mockHub, { isJson: false, isSilent: false });
    const output = consoleLog.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Super Mario Bros.");
    consoleLog.mockRestore();
  });
});
