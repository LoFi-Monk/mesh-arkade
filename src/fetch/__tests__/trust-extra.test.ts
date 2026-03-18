import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDatFromTrustedSource, TRUSTED_DAT_SOURCES } from "../trust.js";
import * as runtime from "../../core/runtime.js";

describe("trust.ts coverage extensions", () => {
  const VALID_SYSTEM = "nes";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original sources just in case
    vi.restoreAllMocks();
  });

  it("handles fetch rejection (network error)", async () => {
    vi.spyOn(runtime, "getFetch").mockResolvedValue(vi.fn().mockRejectedValue(new Error("Network failure")));
    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch verified DAT: Network failure");
  });

  it("handles non-ok response with status text", async () => {
    vi.spyOn(runtime, "getFetch").mockResolvedValue(vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found"
    }));
    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch DAT: 404 Not Found");
  });

  it("handles non-ok response without status text", async () => {
    vi.spyOn(runtime, "getFetch").mockResolvedValue(vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: ""
    }));
    await expect(fetchDatFromTrustedSource(VALID_SYSTEM)).rejects.toThrow("Failed to fetch DAT: 500");
  });

  it("throws on hash mismatch", async () => {
    const originalSources = [...TRUSTED_DAT_SOURCES];
    TRUSTED_DAT_SOURCES.length = 0;
    TRUSTED_DAT_SOURCES.push({
      systemId: "nes",
      description: "Test Hash Source",
      url: "http://test.com",
      expectedHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    });

    vi.spyOn(runtime, "getFetch").mockResolvedValue(vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)) // Hash of empty buffer is not 'aaa...'
    }));

    await expect(fetchDatFromTrustedSource("nes")).rejects.toThrow(/Hash mismatch/);

    TRUSTED_DAT_SOURCES.length = 0;
    TRUSTED_DAT_SOURCES.push(...originalSources);
  });

  it("succeeds on hash match", async () => {
    const originalSources = [...TRUSTED_DAT_SOURCES];
    TRUSTED_DAT_SOURCES.length = 0;
    TRUSTED_DAT_SOURCES.push({
      systemId: "nes",
      description: "Test Hash Source",
      url: "http://test.com",
      // sha1 of empty string
      expectedHash: "da39a3ee5e6b4b0d3255bfef95601890afd80709"
    });

    vi.spyOn(runtime, "getFetch").mockResolvedValue(vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
    }));

    const result = await fetchDatFromTrustedSource("nes");
    expect(result.length).toBe(0);

    TRUSTED_DAT_SOURCES.length = 0;
    TRUSTED_DAT_SOURCES.push(...originalSources);
  });
});
