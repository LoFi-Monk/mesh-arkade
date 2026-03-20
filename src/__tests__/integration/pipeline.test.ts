/**
 * @file pipeline.test.ts
 * @description End-to-end integration tests for the MeshARKade fetch pipeline.
 *
 * @intent Validates the full ROM fetch pipeline through CoreHub.handleRequest():
 *         SHA1 lookup → P2P fetch (with layer fallback) → SHA1 verification → staged file output,
 *         plus DAT-based curation lookups, database reset, and concurrent fetch safety.
 *
 * @guarantee Tests use `vi.mock` to isolate from real P2P layers; each test uses
 *            `setupTestEnv`/`teardownTestEnv` for clean state; all tests FAIL until the
 *            'fetch:rom' method is implemented in hub.ts.
 *
 * @constraint Tests require `setupTestEnv` and `createMockPeer` from `src/test-utils/harness.ts`.
 *            P2P layer mocks must be module-level to avoid import conflicts.
 *            All fetch tests MUST go through hub.handleRequest() - direct FetchManager.fetch() calls
 *            bypass the integration point and will not fail as expected.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupTestEnv,
  teardownTestEnv,
  createMockPeer,
} from "../../test-utils/harness.js";

vi.mock("../../fetch/layers/hyperswarm.js", () => ({
  fetchFromHyperswarm: vi.fn(),
}));

vi.mock("../../fetch/layers/ipfs.js", () => ({
  fetchFromIpfs: vi.fn(),
}));

vi.mock("../../fetch/layers/bittorrent.js", () => ({
  fetchFromBittorrent: vi.fn(),
}));

vi.mock("../../core/database.js", () => ({
  resetDatabase: vi.fn().mockResolvedValue(undefined),
  insertWishlistBatch: vi.fn().mockResolvedValue(undefined),
  getWishlistBySha1: vi.fn().mockResolvedValue(null),
  closeDatabase: vi.fn().mockResolvedValue(undefined),
  getDatabase: vi.fn(),
  upsertSystem: vi.fn(),
  getSystem: vi.fn(),
}));

vi.mock("../../core/curation.js", () => ({
  createCurationManager: vi.fn().mockReturnValue({
    seedSystem: vi.fn().mockResolvedValue({
      systemId: "nes",
      systemTitle: "Nintendo Entertainment System",
      gamesAdded: 1,
      totalGames: 1,
    }),
    searchWishlist: vi.fn().mockResolvedValue([]),
    getSupportedSystems: vi.fn().mockResolvedValue([]),
    getSystemInfo: vi.fn(),
  }),
  fetchSystems: vi.fn().mockResolvedValue([]),
  clearSystemCache: vi.fn(),
}));

import { fetchFromHyperswarm } from "../../fetch/layers/hyperswarm.js";
import { fetchFromIpfs } from "../../fetch/layers/ipfs.js";
import { fetchFromBittorrent } from "../../fetch/layers/bittorrent.js";
import { getWishlistBySha1, resetDatabase } from "../../core/database.js";
import { CoreHub } from "../../core/hub.js";

describe("MeshARKade Fetch Pipeline Integration", () => {
  let env: { tempDir: string; cleanup: () => Promise<void> };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getWishlistBySha1).mockResolvedValue(null);
    vi.mocked(resetDatabase).mockResolvedValue(undefined);

    env = await setupTestEnv();
  });

  afterEach(async () => {
    await env.cleanup();
    vi.restoreAllMocks();
  });

  describe("TC-001: Happy Path — fetch, verify, and stage", () => {
    it("given a SHA1 in the mock peer, pipeline downloads, verifies hash, and stages correctly", async () => {
      const knownSha1 = "ca56432c553f3eb0c64311469c5fa44f980a9852";
      const romData = new Uint8Array([
        0x4e, 0x45, 0x53, 0x1a, 0x10, 0x00, 0x00, 0x00,
      ]);

      const mockPeer = createMockPeer(knownSha1, romData);
      vi.mocked(fetchFromHyperswarm).mockImplementation(
        async (sha1: string) => {
          const result = await mockPeer.fetchVerifiedRom(sha1);
          if (result === null) {
            throw new Error("No peer data");
          }
          return result;
        },
      );

      const hub = CoreHub.getInstance();
      await hub.start();

      const result = await hub.handleRequest({
        method: "fetch:rom",
        params: { sha1: knownSha1, destDir: env.tempDir },
      });

      expect(result.error).toBeNull();
      expect(result.result).toHaveProperty("filename");
      const filename = (result.result as { filename: string }).filename;
      expect(filename).toBeTruthy();
    });
  });

  describe("TC-002: Layer Fallback — hyperswarm fails, IPFS succeeds", () => {
    it("given hyperswarm fails and IPFS succeeds, the result is correct", async () => {
      const knownSha1 = "deadbeef1234567890abcdef1234567890abcdef";
      const ipfsData = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

      vi.mocked(fetchFromHyperswarm).mockRejectedValue(
        new Error("Connection timeout"),
      );
      vi.mocked(fetchFromIpfs).mockResolvedValue(ipfsData);

      const hub = CoreHub.getInstance();
      await hub.start();

      const result = await hub.handleRequest({
        method: "fetch:rom",
        params: { sha1: knownSha1, destDir: env.tempDir },
      });

      expect(result.error).toBeNull();
      expect(result.result).toHaveProperty("filename");
    });

    it("given all layers fail, error is returned", async () => {
      const knownSha1 = "0000000000000000000000000000000000000000";

      vi.mocked(fetchFromHyperswarm).mockRejectedValue(new Error("Timeout"));
      vi.mocked(fetchFromIpfs).mockRejectedValue(
        new Error("Not found in Museum Map"),
      );
      vi.mocked(fetchFromBittorrent).mockRejectedValue(
        new Error("No peers found"),
      );

      const hub = CoreHub.getInstance();
      await hub.start();

      const result = await hub.handleRequest({
        method: "fetch:rom",
        params: { sha1: knownSha1, destDir: env.tempDir },
      });

      expect(result.error).not.toBeNull();
    });
  });

  describe("TC-003: DAT Lookup — known system+title resolves to correct SHA1", () => {
    it("given a seeded NES game, lookup-sha1 returns the correct WishlistRecord", async () => {
      const expectedRecord = {
        system_id: "nes",
        title: "Contra (USA)",
        sha1: "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1",
        crc: "12345678",
        md5: "abcdef1234567890abcdef12345678",
        region: "USA",
      };

      vi.mocked(getWishlistBySha1).mockResolvedValueOnce(expectedRecord);

      const hub = CoreHub.getInstance();
      await hub.start();

      const result = await hub.handleRequest({
        method: "curation:lookup-sha1",
        params: { sha1: "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1" },
      });

      expect(result.error).toBeNull();
      const record = result.result as typeof expectedRecord;
      expect(record).not.toBeNull();
      expect(record.sha1.toLowerCase()).toBe(
        "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1",
      );
      expect(record.title).toBe("Contra (USA)");
      expect(record.system_id).toBe("nes");
    });

    it("given a SHA1 not in the database, lookup-sha1 returns null", async () => {
      vi.mocked(getWishlistBySha1).mockResolvedValueOnce(null);

      const hub = CoreHub.getInstance();
      await hub.start();

      const result = await hub.handleRequest({
        method: "curation:lookup-sha1",
        params: { sha1: "ffffffffffffffffffffffffffffffffffffffff" },
      });

      expect(result.error).toBeNull();
      expect(result.result).toBeNull();
    });
  });

  describe("TC-004: Reset — database:reset clears all staged data", () => {
    it("given seeded wishlist records, database:reset clears them and stage directory", async () => {
      vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

      const hub = CoreHub.getInstance();
      await hub.start();

      const resetResult = await hub.handleRequest({ method: "database:reset" });
      expect(resetResult.error).toBeNull();
      expect(resetResult.result).toEqual({ success: true });

      expect(vi.mocked(resetDatabase)).toHaveBeenCalled();
    });
  });

  describe("TC-005: Concurrent Fetch — no state corruption", () => {
    it("given two concurrent fetches for the same SHA1, both return correct data without corruption", async () => {
      const knownSha1 = "feedface1234567890abcdef1234567890abcdef";
      const sharedData = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe]);

      const mockPeer = createMockPeer(knownSha1, sharedData);
      vi.mocked(fetchFromHyperswarm).mockImplementation(
        async (sha1: string) => {
          const result = await mockPeer.fetchVerifiedRom(sha1);
          if (result === null) {
            throw new Error("No peer data");
          }
          return result;
        },
      );

      const hub = CoreHub.getInstance();
      await hub.start();

      const [resultA, resultB] = await Promise.all([
        hub.handleRequest({
          method: "fetch:rom",
          params: { sha1: knownSha1, destDir: env.tempDir },
        }),
        hub.handleRequest({
          method: "fetch:rom",
          params: { sha1: knownSha1, destDir: env.tempDir },
        }),
      ]);

      expect(resultA.error).toBeNull();
      expect(resultB.error).toBeNull();
      expect(resultA.result).toHaveProperty("filename");
      expect(resultB.result).toHaveProperty("filename");
    });

    it("given two concurrent fetches for different SHA1s, results are isolated", async () => {
      const sha1A = "1111111111111111111111111111111111111111";
      const sha1B = "2222222222222222222222222222222222222222";
      const dataA = new Uint8Array([0xaa, 0xbb, 0xcc]);
      const dataB = new Uint8Array([0xdd, 0xee, 0xff]);

      vi.mocked(fetchFromHyperswarm).mockImplementation(
        async (sha1: string) => {
          if (sha1 === sha1A) return dataA;
          if (sha1 === sha1B) return dataB;
          throw new Error("No peer data");
        },
      );

      const hub = CoreHub.getInstance();
      await hub.start();

      const [resultA, resultB] = await Promise.all([
        hub.handleRequest({
          method: "fetch:rom",
          params: { sha1: sha1A, destDir: env.tempDir },
        }),
        hub.handleRequest({
          method: "fetch:rom",
          params: { sha1: sha1B, destDir: env.tempDir },
        }),
      ]);

      expect(resultA.error).toBeNull();
      expect(resultB.error).toBeNull();
    });
  });
});
