import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RandomAccessMemory from "random-access-memory";
import Corestore from "corestore";
import Hyperbee from "hyperbee";

vi.stubGlobal("Pear", {
  app: {
    args: [],
    key: null,
    dev: true,
    storage: "./test-storage",
  },
});

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
  },
}));

vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
    rename: vi.fn(),
  },
}));

describe("Database Module - with random-access-memory", () => {
  let getDatabase: () => Promise<Hyperbee>;
  let upsertSystem: (system: any) => Promise<void>;
  let insertWishlistBatch: (records: any[]) => Promise<void>;
  let searchWishlist: (
    query: string,
    systemId?: string,
    limit?: number,
  ) => Promise<any[]>;
  let resetDatabase: () => Promise<void>;
  let closeDatabase: () => Promise<void>;
  let getSystem: (systemId: string) => Promise<any>;

  beforeEach(async () => {
    vi.resetModules();

    const db = await import("../database.js");
    getDatabase = db.getDatabase;
    upsertSystem = db.upsertSystem;
    insertWishlistBatch = db.insertWishlistBatch;
    searchWishlist = db.searchWishlist;
    resetDatabase = db.resetDatabase;
    closeDatabase = db.closeDatabase;
    getSystem = db.getSystem;
  });

  afterEach(async () => {
    try {
      await closeDatabase();
    } catch {}
  });

  describe("getDatabase", () => {
    it("should return a Hyperbee instance", async () => {
      const db = await getDatabase();
      expect(db).toBeDefined();
      expect(typeof db.sub).toBe("function");
    });

    it("should return the same instance on subsequent calls", async () => {
      const db1 = await getDatabase();
      const db2 = await getDatabase();
      expect(db1).toBe(db2);
    });

    it("should create subsystems for systems and wishlist", async () => {
      const db = await getDatabase();
      const systems = db.sub("systems");
      const wishlist = db.sub("wishlist");
      expect(systems).toBeDefined();
      expect(wishlist).toBeDefined();
    });
  });

  describe("upsertSystem", () => {
    it("should insert a new system record", async () => {
      await upsertSystem({
        id: "nes",
        title: "Nintendo Entertainment System",
        dat_url: "http://example.com/nes.dat",
        last_updated: "2024-01-01T00:00:00.000Z",
      });

      const system = await getSystem("nes");
      expect(system).toBeDefined();
      expect(system.id).toBe("nes");
      expect(system.title).toBe("Nintendo Entertainment System");
      expect(system.dat_url).toBe("http://example.com/nes.dat");
    });

    it("should update an existing system record", async () => {
      await upsertSystem({
        id: "snes",
        title: "Super Nintendo",
        dat_url: "http://example.com/snes.dat",
        last_updated: "2024-01-01T00:00:00.000Z",
      });

      await upsertSystem({
        id: "snes",
        title: "Super Nintendo Entertainment System",
        dat_url: "http://example.com/snes-updated.dat",
        last_updated: "2024-02-01T00:00:00.000Z",
      });

      const system = await getSystem("snes");
      expect(system.title).toBe("Super Nintendo Entertainment System");
      expect(system.dat_url).toBe("http://example.com/snes-updated.dat");
    });
  });

  describe("insertWishlistBatch", () => {
    it("should insert multiple wishlist records", async () => {
      const records = [
        {
          system_id: "nes",
          title: "Super Mario Bros.",
          sha1: "abc123def456789012345678901234567890",
          crc: "12345678",
          md5: "abcd1234567890abcd1234567890abcd",
          region: "USA",
        },
        {
          system_id: "nes",
          title: "The Legend of Zelda",
          sha1: "xyz789abc456123012345678901234567890",
          crc: "87654321",
          md5: "zyxw9876543210zyxw9876543210zyxw",
          region: "USA",
        },
      ];

      await insertWishlistBatch(records);

      const results = await searchWishlist("Mario");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain("Mario");
    });

    it("should handle empty array without error", async () => {
      await expect(insertWishlistBatch([])).resolves.not.toThrow();
    });

    it("should generate correct keys for sha1 entries", async () => {
      const records = [
        {
          system_id: "nes",
          title: "Game A",
          sha1: "abcd123456789012345678901234567890abcdef",
          crc: "",
          md5: "",
          region: "USA",
        },
      ];

      await insertWishlistBatch(records);
      const results = await searchWishlist("Game A");
      expect(results.length).toBe(1);
    });

    it("should generate correct keys for crc entries", async () => {
      const records = [
        {
          system_id: "snes",
          title: "Game B",
          sha1: "",
          crc: "a1b2c3d4",
          md5: "",
          region: "Europe",
        },
      ];

      await insertWishlistBatch(records);
      const results = await searchWishlist("Game B");
      expect(results.length).toBe(1);
    });

    it("should generate correct keys for md5 entries", async () => {
      const records = [
        {
          system_id: "gba",
          title: "Game C",
          sha1: "",
          crc: "",
          md5: "abcd1234567890abcd1234567890abcd",
          region: "Japan",
        },
      ];

      await insertWishlistBatch(records);
      const results = await searchWishlist("Game C");
      expect(results.length).toBe(1);
    });
  });

  describe("searchWishlist", () => {
    beforeEach(async () => {
      const records = [
        {
          system_id: "nes",
          title: "Super Mario Bros. 3",
          sha1: "aaaa123456789012345678901234567890abcaaa",
          crc: "11111111",
          md5: "aaa1234567890abcd1234567890abcdaaa",
          region: "USA",
        },
        {
          system_id: "nes",
          title: "Super Mario Bros.",
          sha1: "bbbb123456789012345678901234567890abcbba",
          crc: "22222222",
          md5: "bbb1234567890abcd1234567890abcdbbba",
          region: "USA",
        },
        {
          system_id: "nes",
          title: "The Legend of Zelda",
          sha1: "cccc123456789012345678901234567890abccca",
          crc: "33333333",
          md5: "ccc1234567890abcd1234567890abcdccca",
          region: "USA",
        },
        {
          system_id: "snes",
          title: "Super Mario World",
          sha1: "dddd123456789012345678901234567890abcdda",
          crc: "44444444",
          md5: "ddd1234567890abcd1234567890abcddddda",
          region: "USA",
        },
      ];

      await insertWishlistBatch(records);
    });

    it("should find games by title query", async () => {
      const results = await searchWishlist("Mario");
      expect(results.length).toBeGreaterThanOrEqual(3);
      const titles = results.map((r) => r.title);
      expect(titles.some((t) => t.includes("Mario"))).toBe(true);
    });

    it("should be case insensitive", async () => {
      const results = await searchWishlist("zelda");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain("Zelda");
    });

    it("should filter by system ID when provided", async () => {
      const results = await searchWishlist("Mario", "snes");
      expect(results.length).toBe(1);
      expect(results[0].title).toContain("Mario World");
      expect(results[0].system_id).toBe("snes");
    });

    it("should respect limit parameter", async () => {
      const results = await searchWishlist("Mario", undefined, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array for no matches", async () => {
      const results = await searchWishlist("nonexistentgame12345");
      expect(results).toEqual([]);
    });
  });

  describe("resetDatabase", () => {
    it("should close database connections", async () => {
      const db = await getDatabase();
      expect(db).toBeDefined();

      await resetDatabase();
    });
  });

  describe("closeDatabase", () => {
    it("should close database and allow reinitialization", async () => {
      const db1 = await getDatabase();
      expect(db1).toBeDefined();

      await closeDatabase();

      const db2 = await getDatabase();
      expect(db2).toBeDefined();
    });
  });
});
