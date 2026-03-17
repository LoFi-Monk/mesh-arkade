import { describe, it, expect } from "vitest";
import { clamp } from "../utils.js";

describe("utils.ts", () => {
  describe("clamp", () => {
    it("should return the value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("should return min when value is below range", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("should return max when value is above range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("should handle edge case at min boundary", () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it("should handle edge case at max boundary", () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it("should handle negative min and max values", () => {
      expect(clamp(0, -10, -5)).toBe(-5);
      expect(clamp(-7, -10, -5)).toBe(-7);
      expect(clamp(-15, -10, -5)).toBe(-10);
    });

    it("should handle decimal values", () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(-0.5, 0, 1)).toBe(0);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it("should handle when min equals max", () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(0, 5, 5)).toBe(5);
      expect(clamp(10, 5, 5)).toBe(5);
    });
  });
});
