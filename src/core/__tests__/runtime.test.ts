import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
};

const mockPath = {
  join: vi.fn((...args: string[]) => args.join("/")),
  dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
};

const mockOs = {
  homedir: vi.fn(() => "/home/test"),
  tmpdir: vi.fn(() => "/tmp"),
};

const mockBareFetch = vi.fn();

describe("runtime.ts", () => {
  describe("Node.js environment", () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal("Bare", undefined);
      vi.stubGlobal("fetch", undefined);
    });

    afterEach(() => {
      vi.resetModules();
      vi.unstubAllGlobals();
    });

    it("should resolve fs module from Node.js", async () => {
      vi.mock("fs", () => ({
        default: mockFs,
        ...mockFs,
      }));

      const { getFs } = await import("../runtime.js");
      const fs = await getFs();
      expect(fs).toBeDefined();
    });

    it("should resolve path module from Node.js", async () => {
      vi.mock("path", () => ({
        default: mockPath,
        ...mockPath,
      }));

      const { getPath } = await import("../runtime.js");
      const path = await getPath();
      expect(path).toBeDefined();
    });

    it("should resolve os module from Node.js", async () => {
      vi.mock("os", () => ({
        default: mockOs,
        ...mockOs,
      }));

      const { getOs } = await import("../runtime.js");
      const os = await getOs();
      expect(os).toBeDefined();
    });

    it("should fall back to node-fetch when globalThis.fetch is undefined", async () => {
      vi.mock("node-fetch", () => ({
        default: mockBareFetch,
      }));

      const { getFetch } = await import("../runtime.js");
      const fetch = await getFetch();
      expect(fetch).toBe(mockBareFetch);
    });

    it("should use globalThis.fetch when available", async () => {
      const mockGlobalFetch = vi.fn();
      vi.stubGlobal("fetch", mockGlobalFetch);

      const { getFetch } = await import("../runtime.js");
      const fetch = await getFetch();
      expect(fetch).toBe(mockGlobalFetch);
    });

    it("should cache modules after first resolution", async () => {
      vi.mock("fs", () => ({
        default: mockFs,
        ...mockFs,
      }));

      const { getFs } = await import("../runtime.js");
      const fs1 = await getFs();
      const fs2 = await getFs();
      expect(fs1).toBe(fs2);
    });
  });

  describe("Bare environment", () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal("Bare", {});
      vi.stubGlobal("fetch", undefined);
    });

    afterEach(() => {
      vi.resetModules();
      vi.unstubAllGlobals();
    });

    it("should resolve fs module from bare-fs", async () => {
      vi.mock("bare-fs", () => ({
        default: mockFs,
      }));

      const { getFs } = await import("../runtime.js");
      const fs = await getFs();
      expect(fs).toBeDefined();
    });

    it("should resolve path module from bare-path", async () => {
      vi.mock("bare-path", () => ({
        default: mockPath,
      }));

      const { getPath } = await import("../runtime.js");
      const path = await getPath();
      expect(path).toBeDefined();
    });

    it("should resolve os module from bare-os", async () => {
      vi.mock("bare-os", () => ({
        default: mockOs,
      }));

      const { getOs } = await import("../runtime.js");
      const os = await getOs();
      expect(os).toBeDefined();
    });

    it("should resolve fetch from bare-fetch", async () => {
      vi.mock("bare-fetch", () => ({
        default: mockBareFetch,
      }));

      const { getFetch } = await import("../runtime.js");
      const fetch = await getFetch();
      expect(fetch).toBe(mockBareFetch);
    });
  });

  describe("Fetch fallback chain priority", () => {
    afterEach(() => {
      vi.resetModules();
      vi.unstubAllGlobals();
    });

    it("should prefer bare-fetch in Bare environment over globalThis", async () => {
      vi.resetModules();
      vi.stubGlobal("Bare", {});
      const mockGlobalFetch = vi.fn();
      vi.stubGlobal("fetch", mockGlobalFetch);
      vi.mock("bare-fetch", () => ({
        default: mockBareFetch,
      }));

      const { getFetch } = await import("../runtime.js");
      const fetch = await getFetch();
      expect(fetch).toBe(mockBareFetch);
    });

    it("should prefer globalThis.fetch over node-fetch in Node environment", async () => {
      vi.resetModules();
      vi.stubGlobal("Bare", undefined);
      const mockGlobalFetch = vi.fn();
      vi.stubGlobal("fetch", mockGlobalFetch);
      vi.mock("node-fetch", () => ({
        default: mockBareFetch,
      }));

      const { getFetch } = await import("../runtime.js");
      const fetch = await getFetch();
      expect(fetch).toBe(mockGlobalFetch);
    });

    it("should cache crypto module after first resolution", async () => {
      vi.resetModules();
      vi.stubGlobal("Bare", undefined);
      vi.mock("crypto", () => ({
        default: {
          createHash: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
              digest: vi.fn().mockReturnValue("abc123"),
            }),
          }),
        },
        createHash: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            digest: vi.fn().mockReturnValue("abc123"),
          }),
        }),
      }));

      const { getCrypto } = await import("../runtime.js");
      const crypto1 = await getCrypto();
      const crypto2 = await getCrypto();

      expect(crypto1).toBe(crypto2);
      expect(crypto1.createHash).toBeDefined();
    });
  });
});
