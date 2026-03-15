import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDatFromTrustedSource } from "../trust.js";

vi.mock("../../core/runtime.js", () => ({
  getFetch: vi.fn(),
  getCrypto: vi.fn(),
}));

import { getFetch, getCrypto } from "../../core/runtime.js";

describe("trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("Unknown systemId: throws 'No trusted source configured'", async () => {
    await expect(fetchDatFromTrustedSource("unknown-system")).rejects.toThrow(
      "No trusted source configured for system: unknown-system",
    );
  });

  it("Known systemId, expectedHash empty: returns buffer, logs console.warn", async () => {
    const testBuffer = Buffer.from(JSON.stringify({ games: [] }));

    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(testBuffer.buffer),
    };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(getFetch).mockResolvedValue(mockFetch as any);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchDatFromTrustedSource("nes");

    expect(result).toBeInstanceOf(Buffer);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("Known systemId, response not ok (404): throws error", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
    };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(getFetch).mockResolvedValue(mockFetch as any);

    await expect(fetchDatFromTrustedSource("nes")).rejects.toThrow("404");
  });

  it("Known systemId, response not ok (500): throws error", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(getFetch).mockResolvedValue(mockFetch as any);

    await expect(fetchDatFromTrustedSource("nes")).rejects.toThrow("500");
  });

  it("Network error during fetch: throws error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked(getFetch).mockResolvedValue(mockFetch as any);

    await expect(fetchDatFromTrustedSource("nes")).rejects.toThrow(
      "Failed to fetch",
    );
  });
});
