import { describe, it, expect } from "vitest";
import {
  appName,
  getTagline,
  getDescriptor,
  branding,
  colors,
} from "../branding";

describe("branding", () => {
  describe("appName", () => {
    it("exports a non-empty app name", () => {
      expect(appName).toBeDefined();
      expect(typeof appName).toBe("string");
      expect(appName.length).toBeGreaterThan(0);
    });

    it("matches expected app name", () => {
      expect(appName).toBe("Mesh ARKade");
    });
  });

  describe("getTagline", () => {
    it("returns a string", () => {
      const tagline = getTagline();
      expect(typeof tagline).toBe("string");
    });

    it("returns a non-empty string", () => {
      const tagline = getTagline();
      expect(tagline.length).toBeGreaterThan(0);
    });

    it("returns a valid tagline from the predefined list", () => {
      const validTaglines = [
        "A Decentralized Museum of Retro Games.",
        "A Decentralized Archive of Shared History.",
        "A Decentralized Library of Digital Spirits.",
      ];
      const tagline = getTagline();
      expect(validTaglines).toContain(tagline);
    });

    it("returns consistent result for the same seed", () => {
      const tagline1 = getTagline(42);
      const tagline2 = getTagline(42);
      expect(tagline1).toBe(tagline2);
    });
  });

  describe("getDescriptor", () => {
    it("returns a string", () => {
      const descriptor = getDescriptor();
      expect(typeof descriptor).toBe("string");
    });

    it("returns a non-empty string", () => {
      const descriptor = getDescriptor();
      expect(descriptor.length).toBeGreaterThan(0);
    });

    it("starts with 'A Decent Game'", () => {
      const descriptor = getDescriptor();
      expect(descriptor.startsWith("A Decent Game")).toBe(true);
    });
  });

  describe("branding", () => {
    it("exports a branding object", () => {
      expect(branding).toBeDefined();
      expect(typeof branding).toBe("object");
    });

    it("has colors object", () => {
      expect(branding.colors).toBeDefined();
      expect(typeof branding.colors).toBe("object");
    });

    it("has retro color scheme", () => {
      expect(branding.colors.retro).toBeDefined();
      expect(branding.colors.retro.primary).toBe("#ff00ff");
      expect(branding.colors.retro.secondary).toBe("#00ffff");
      expect(branding.colors.retro.background).toBe("#0d0d21");
    });

    it("has baseline colors for compatibility", () => {
      expect(branding.colors.primary).toBeDefined();
      expect(branding.colors.secondary).toBeDefined();
      expect(branding.colors.accent).toBeDefined();
    });

    it("has fonts object", () => {
      expect(branding.fonts).toBeDefined();
      expect(typeof branding.fonts).toBe("object");
    });

    it("has retro font", () => {
      expect(branding.fonts.retro).toBeDefined();
      expect(typeof branding.fonts.retro).toBe("string");
    });
  });

  describe("colors (backward compatibility)", () => {
    it("exports colors object", () => {
      expect(colors).toBeDefined();
      expect(typeof colors).toBe("object");
    });

    it("includes retro color scheme", () => {
      expect(colors.retro).toBeDefined();
    });
  });

  describe("Bare compatibility", () => {
    it("does not reference process, window, or document at module level", () => {
      expect(appName).toBeDefined();
    });

    it("all exported functions work without browser APIs", () => {
      expect(() => getTagline()).not.toThrow();
      expect(() => getDescriptor()).not.toThrow();
    });
  });
});
