import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupCid, getMuseumMapVersion } from "../museum-map.js";

vi.mock("../museum-map.json", () => ({
  default: {
    $schema: "https://mesh-arkade.example.com/museum-map/v1.json",
    description: "Test mapping",
    version: 1,
    mappings: {
      abc123def456789012345678901234567890abcd: "QmTestCid123456789",
      "123456789012345678901234567890abcdef12": "QmAnotherTestCid",
    },
  },
}));

describe("museum-map", () => {
  describe("lookupCid", () => {
    it("returns null for unknown SHA1", () => {
      const result = lookupCid("0000000000000000000000000000000000000000");
      expect(result).toBeNull();
    });

    it("returns CID string for known SHA1", () => {
      const result = lookupCid("abc123def456789012345678901234567890abcd");
      expect(result).toBe("QmTestCid123456789");
    });

    it("returns CID for uppercase SHA1 (case insensitive)", () => {
      const result = lookupCid("ABC123DEF456789012345678901234567890ABCD");
      expect(result).toBe("QmTestCid123456789");
    });

    it("returns CID for mixed case SHA1", () => {
      const result = lookupCid("AbC123dEf456789012345678901234567890aBcD");
      expect(result).toBe("QmTestCid123456789");
    });
  });

  describe("getMuseumMapVersion", () => {
    it("returns the museum map version", () => {
      expect(getMuseumMapVersion()).toBe(1);
    });
  });
});
