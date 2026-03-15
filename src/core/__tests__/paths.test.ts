import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("paths.ts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  describe("getStorageBasePath", () => {
    it("should return Pear.app.storage when Pear is defined with storage", async () => {
      vi.stubGlobal("Pear", {
        app: {
          args: [],
          key: null,
          dev: true,
          storage: "/pear/storage",
        },
      });

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("/pear/storage");
    });

    it("should return './data' fallback when Pear.app.storage is undefined", async () => {
      vi.stubGlobal("Pear", {
        app: {
          args: [],
          key: null,
          dev: true,
          storage: undefined,
        },
      });

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("./data");
    });

    it("should return './data' fallback when Pear is undefined", async () => {
      vi.stubGlobal("Pear", undefined);

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("./data");
    });

    it("should return './data' fallback when Pear.app is undefined", async () => {
      vi.stubGlobal("Pear", undefined);

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("./data");
    });

    it("should return './data' when Pear.app exists but has no storage property", async () => {
      vi.stubGlobal("Pear", {
        app: {
          args: [],
          key: null,
          dev: true,
        },
      });

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("./data");
    });

    it("should return './data' fallback when storage is empty string", async () => {
      vi.stubGlobal("Pear", {
        app: {
          args: [],
          key: null,
          dev: true,
          storage: "",
        },
      });

      const { getStorageBasePath } = await import("../paths.js");
      expect(getStorageBasePath()).toBe("./data");
    });
  });
});
