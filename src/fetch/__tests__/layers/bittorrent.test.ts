import { describe, it, expect } from "vitest";
import { fetchFromBittorrent } from "../../layers/bittorrent.js";
import { FetchLayerError } from "../../errors.js";

describe("fetchFromBittorrent", () => {
  it("throws FetchLayerError with 'not yet implemented' message", async () => {
    await expect(
      fetchFromBittorrent("abc123def456789012345678901234567890abcd"),
    ).rejects.toThrow(FetchLayerError);

    try {
      await fetchFromBittorrent("abc123def456789012345678901234567890abcd");
    } catch (err) {
      expect(err).toBeInstanceOf(FetchLayerError);
      expect((err as FetchLayerError).message).toContain("not yet implemented");
    }
  });

  it("accepts options parameter without error", async () => {
    await expect(
      fetchFromBittorrent("abc123def456789012345678901234567890abcd", {
        timeout: 5000,
        onProgress: () => {},
      }),
    ).rejects.toThrow(FetchLayerError);
  });
});
