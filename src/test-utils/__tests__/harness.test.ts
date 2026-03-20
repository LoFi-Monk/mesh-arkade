import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupTestEnv, teardownTestEnv, createMockPeer } from "../harness.js";

describe("harness utilities", () => {
  describe("setupTestEnv", () => {
    it("should stub Pear.app.storage to a temp directory", async () => {
      const env = await setupTestEnv();

      expect(env.tempDir).toBeDefined();
      expect(env.tempDir.length).toBeGreaterThan(0);
      expect(env.tempDir).toContain("mesharkade-test");
    });

    it("should return a cleanup function", async () => {
      const { cleanup } = await setupTestEnv();

      expect(typeof cleanup).toBe("function");
    });

    it("should allow calling setup multiple times", async () => {
      const env1 = await setupTestEnv();
      const env2 = await setupTestEnv();

      expect(env1.tempDir).toBeDefined();
      expect(env2.tempDir).toBeDefined();
    });
  });

  describe("teardownTestEnv", () => {
    it("should handle being called without prior setup", async () => {
      await teardownTestEnv();
      await teardownTestEnv();
    });

    it("should reset CoreHub singleton", async () => {
      await setupTestEnv();
      await teardownTestEnv();
    });
  });

  describe("createMockPeer", () => {
    it("should return a mock fetch layer", () => {
      const sha1 = "ca56432c553f3eb0c64311469c5fa44f980a9852";
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const mock = createMockPeer(sha1, data);

      expect(mock).toBeDefined();
      expect(typeof mock.fetchVerifiedRom).toBe("function");
    });

    it("should return a mock that serves bytes for matching SHA1", async () => {
      const sha1 = "ca56432c553f3eb0c64311469c5fa44f980a9852";
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const mock = createMockPeer(sha1, data);

      const result = await mock.fetchVerifiedRom(sha1);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(data);
    });

    it("should return null for non-matching SHA1", async () => {
      const sha1 = "ca56432c553f3eb0c64311469c5fa44f980a9852";
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const mock = createMockPeer(sha1, data);

      const wrongSha1 = "0000000000000000000000000000000000000000";
      const result = await mock.fetchVerifiedRom(wrongSha1);
      expect(result).toBeNull();
    });

    it("should handle empty data array", async () => {
      const sha1 = "ca56432c553f3eb0c64311469c5fa44f980a9852";
      const data = new Uint8Array(0);
      const mock = createMockPeer(sha1, data);

      const result = await mock.fetchVerifiedRom(sha1);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result!.length).toBe(0);
    });
  });
});
