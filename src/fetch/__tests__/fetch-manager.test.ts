import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchManager } from "../fetch-manager.js";
import { AllLayersFailedError, FetchLayerError } from "../errors.js";

vi.mock("../../core/runtime.js", () => ({
  getFs: vi.fn().mockResolvedValue({
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  }),
  getPath: vi.fn().mockResolvedValue({
    join: vi.fn((...args) => args.join("/")),
  }),
}));

vi.mock("../../fetch/layers/hyperswarm.js", () => ({
  fetchFromHyperswarm: vi.fn(),
}));

vi.mock("../../fetch/layers/ipfs.js", () => ({
  fetchFromIpfs: vi.fn(),
}));

vi.mock("../../fetch/layers/bittorrent.js", () => ({
  fetchFromBittorrent: vi.fn(),
}));

import { fetchFromHyperswarm } from "../../fetch/layers/hyperswarm.js";
import { fetchFromIpfs } from "../../fetch/layers/ipfs.js";
import { fetchFromBittorrent } from "../../fetch/layers/bittorrent.js";

describe("FetchManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetch", () => {
    it("Hyperswarm succeeds: fetch() returns data from hyperswarm layer", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const manager = new FetchManager();
      const result = await manager.fetch(
        "abc123def456789012345678901234567890abcd",
      );

      expect(fetchFromHyperswarm).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it("Hyperswarm fails, IPFS succeeds: falls through to IPFS layer", async () => {
      const testData = new Uint8Array([6, 7, 8, 9]);
      vi.mocked(fetchFromHyperswarm).mockRejectedValue(
        new FetchLayerError("hyperswarm", "timeout"),
      );
      vi.mocked(fetchFromIpfs).mockResolvedValue(testData);

      const manager = new FetchManager();
      const result = await manager.fetch(
        "abc123def456789012345678901234567890abcd",
      );

      expect(fetchFromHyperswarm).toHaveBeenCalled();
      expect(fetchFromIpfs).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it("Hyperswarm fails, IPFS fails, BitTorrent fails: throws AllLayersFailedError", async () => {
      vi.mocked(fetchFromHyperswarm).mockRejectedValue(
        new FetchLayerError("hyperswarm", "timeout"),
      );
      vi.mocked(fetchFromIpfs).mockRejectedValue(
        new FetchLayerError("ipfs", "not found"),
      );
      vi.mocked(fetchFromBittorrent).mockRejectedValue(
        new FetchLayerError("bittorrent", "not implemented"),
      );

      const manager = new FetchManager();
      await expect(
        manager.fetch("abc123def456789012345678901234567890abcd"),
      ).rejects.toThrow(AllLayersFailedError);
    });

    it("All layers fail: aggregates errors from all layers", async () => {
      vi.mocked(fetchFromHyperswarm).mockRejectedValue(
        new FetchLayerError("hyperswarm", "timeout"),
      );
      vi.mocked(fetchFromIpfs).mockRejectedValue(
        new FetchLayerError("ipfs", "network error"),
      );
      vi.mocked(fetchFromBittorrent).mockRejectedValue(
        new FetchLayerError("bittorrent", "DHT timeout"),
      );

      const manager = new FetchManager();
      try {
        await manager.fetch("abc123def456789012345678901234567890abcd");
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AllLayersFailedError);
        const allErr = err as AllLayersFailedError;
        expect(allErr.errors).toHaveLength(3);
        expect(allErr.errors[0].layer).toBe("hyperswarm");
        expect(allErr.errors[1].layer).toBe("ipfs");
        expect(allErr.errors[2].layer).toBe("bittorrent");
      }
    });

    it("BitTorrent succeeds with progress callback", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      vi.mocked(fetchFromHyperswarm).mockRejectedValue(
        new FetchLayerError("hyperswarm", "timeout"),
      );
      vi.mocked(fetchFromIpfs).mockRejectedValue(
        new FetchLayerError("ipfs", "not found"),
      );
      vi.mocked(fetchFromBittorrent).mockResolvedValue(testData);

      const manager = new FetchManager();
      const progressCalls: { layer: string; bytes: number }[] = [];
      manager.onProgress((progress) => {
        progressCalls.push(progress);
      });

      const result = await manager.fetch(
        "abc123def456789012345678901234567890abcd",
      );

      expect(fetchFromBittorrent).toHaveBeenCalled();
      expect(result).toEqual(testData);
      expect(progressCalls.some((p) => p.layer === "bittorrent")).toBe(true);
    });
  });

  describe("onProgress callback", () => {
    it("fires with correct layer name and bytes", async () => {
      const testData = new Uint8Array([1, 2, 3]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const manager = new FetchManager();
      const progressCalls: { layer: string; bytes: number }[] = [];
      manager.onProgress((progress) => {
        progressCalls.push(progress);
      });

      await manager.fetch("abc123def456789012345678901234567890abcd");

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[0].layer).toBe("hyperswarm");
    });
  });

  describe("fetchAndStage", () => {
    it("writes data to destDir/<sha1>.bin when no record provided", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const { getFs, getPath } = await import("../../core/runtime.js");
      const fs = await getFs();
      const path = await getPath();

      const manager = new FetchManager();
      const filename = await manager.fetchAndStage(
        "abc123def456789012345678901234567890abcd",
        "/test/dest",
        undefined,
      );

      expect(filename).toBe("abc123def456789012345678901234567890abcd.bin");
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it("resolves filename from WishlistRecord.title when record matches", async () => {
      const testData = new Uint8Array([1, 2, 3]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const manager = new FetchManager();
      const records = [
        {
          title: "Super Mario Bros. (USA).zip",
          sha1: "abc123def456789012345678901234567890abcd",
        } as any,
      ];

      const filename = await manager.fetchAndStage(
        "abc123def456789012345678901234567890abcd",
        "/test/dest",
        records,
      );

      expect(filename).toBe("Super Mario Bros. (USA).zip");
    });

    it("sanitizes filename with special characters", async () => {
      const testData = new Uint8Array([1, 2, 3]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const manager = new FetchManager();
      const records = [
        {
          title: 'Super "Mario" Bros <USA>.zip',
          sha1: "abc123def456789012345678901234567890abcd",
        } as any,
      ];

      const filename = await manager.fetchAndStage(
        "abc123def456789012345678901234567890abcd",
        "/test/dest",
        records,
      );

      expect(filename).toBe("Super _Mario_ Bros _USA_.zip");
    });

    it("uses sha1.bin when record has empty title", async () => {
      const testData = new Uint8Array([1, 2, 3]);
      vi.mocked(fetchFromHyperswarm).mockResolvedValue(testData);

      const manager = new FetchManager();
      const records = [
        {
          title: "",
          sha1: "abc123def456789012345678901234567890abcd",
        } as any,
      ];

      const filename = await manager.fetchAndStage(
        "abc123def456789012345678901234567890abcd",
        "/test/dest",
        records,
      );

      expect(filename).toBe("abc123def456789012345678901234567890abcd.bin");
    });
  });
});
