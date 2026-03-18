import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDatFromTrustedSource, TRUSTED_DAT_SOURCES } from "../trust.js";
import * as runtime from "../../core/runtime.js";

const mockFetch = vi.fn();

describe("trust.ts", () => {
  const VALID_SYSTEM = "nes"; // Use nes which exists in TRUSTED_DAT_SOURCES

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(runtime, "getFetch").mockResolvedValue(mockFetch as any);
  });

  it("exports TRUSTED_DAT_SOURCES", () => {
    expect(TRUSTED_DAT_SOURCES).toBeDefined();
    expect(Array.isArray(TRUSTED_DAT_SOURCES)).toBe(true);
  });

  it("successfully fetches from primary source", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    });

    const result = await fetchDatFromTrustedSource(VALID_SYSTEM);
    // trust.ts returns a Buffer (Buffer.from(arrayBuffer)).
    expect(result).toEqual(Buffer.from([1, 2, 3]));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("Nintendo"));
  });

  it("falls back to secondary source when primary fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });

    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch DAT: 404 Not Found");
  });

  it("handles timeout error from fetch", async () => {
    mockFetch.mockRejectedValue(new Error("Timeout"));

    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch verified DAT: Timeout");
  });

  it("handles all sources failing", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: "Internal Error" });

    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch DAT: 500 Internal Error");
  });

  it("requires valid system ID", async () => {
    await expect(fetchDatFromTrustedSource("nonexistent")).rejects.toThrow("No trusted source configured for system: nonexistent");
  });
});
