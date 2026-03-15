import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFromBittorrent } from "../../layers/bittorrent.js";
import { FetchLayerError } from "../../errors.js";

vi.mock("bittorrent-dht", () => ({
  default: vi.fn().mockImplementation(() => {
    return {
      on: vi.fn(),
      lookup: vi.fn(),
      destroy: vi.fn(),
    };
  }),
}));

describe("fetchFromBittorrent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("No DHT node is created", async () => {
    const DHT = await import("bittorrent-dht");

    await expect(
      fetchFromBittorrent("abc123def456789012345678901234567890abcd"),
    ).rejects.toThrow();

    expect(DHT.default).not.toHaveBeenCalled();
  });
});
