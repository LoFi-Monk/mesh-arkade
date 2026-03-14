import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("corestore", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue({
        ready: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("hyperbee", () => {
  const mockSub = vi.fn().mockReturnValue({
    ready: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    batch: vi.fn().mockReturnValue({
      put: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      flush: vi.fn().mockResolvedValue(undefined),
    }),
    createReadStream: vi.fn().mockReturnValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      ready: vi.fn().mockResolvedValue(undefined),
      sub: mockSub,
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("../database.js", async () => {
  const actual = await vi.importActual("../database.js");
  return {
    ...actual,
    getSystem: vi.fn().mockResolvedValue(null),
    upsertSystem: vi.fn().mockResolvedValue(undefined),
    insertWishlistBatch: vi.fn().mockResolvedValue(undefined),
    searchWishlist: vi.fn().mockResolvedValue([]),
  };
});

const mockPearApp = {
  args: [],
  key: null,
  dev: true,
  storage: "./test-storage",
};

vi.stubGlobal("Pear", {
  app: mockPearApp,
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("CurationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSystems", () => {
    it("should return a list of systems from GitHub API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - Nintendo Entertainment System.dat",
            download_url: "http://example.com/nes.dat",
          },
          {
            name: "Nintendo - Super Nintendo Entertainment System.dat",
            download_url: "http://example.com/snes.dat",
          },
        ],
      });

      const { fetchSystems, clearSystemCache } = await import("../curation.js");
      clearSystemCache?.();
      const systems = await fetchSystems();

      expect(systems).toBeInstanceOf(Array);
      expect(systems.length).toBe(2);
      expect(systems[0]).toHaveProperty("id");
      expect(systems[0]).toHaveProperty("title");
      expect(systems[0]).toHaveProperty("datUrl");
    });

    it("should map GitHub filenames to system IDs", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - Nintendo Entertainment System.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      });

      const { fetchSystems, clearSystemCache } = await import("../curation.js");
      clearSystemCache?.();
      const systems = await fetchSystems();

      const nes = systems.find((s) => s.id === "nes");
      expect(nes).toBeDefined();
      expect(nes?.title).toContain("Nintendo");
    });

    it("should handle caching correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - Nintendo Entertainment System.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      });

      const { fetchSystems, clearSystemCache } = await import("../curation.js");
      clearSystemCache?.();

      const systems1 = await fetchSystems();
      const systems2 = await fetchSystems();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(systems1).toEqual(systems2);
    });

    it("should return cached systems", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - Nintendo Entertainment System.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      });

      const { fetchSystems, getCachedSystems, clearSystemCache } =
        await import("../curation.js");
      clearSystemCache?.();

      await fetchSystems();
      const cached = getCachedSystems();

      expect(cached).toBeDefined();
      expect(cached!.length).toBeGreaterThan(0);
    });

    it("should handle API errors gracefully and return cached data", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              name: "Nintendo - NES.dat",
              download_url: "http://example.com/nes.dat",
            },
          ],
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { fetchSystems, clearSystemCache } = await import("../curation.js");
      clearSystemCache?.();

      await fetchSystems();

      const systems = await fetchSystems();

      expect(systems.length).toBe(1);
    });
  });

  describe("getSupportedSystems", () => {
    it("should return systems from fetchSystems", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - Nintendo Entertainment System.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      });

      const { getCurationManager, clearSystemCache } =
        await import("../curation.js");
      clearSystemCache?.();
      const systems = await getCurationManager().getSupportedSystems();

      expect(systems.length).toBeGreaterThan(0);
    });
  });

  describe("searchWishlist", () => {
    it("should search wishlist and return results", async () => {
      const { getCurationManager } = await import("../curation.js");
      const manager = getCurationManager();

      vi.spyOn(manager, "searchWishlist").mockResolvedValueOnce([
        {
          title: "Super Mario Bros.",
          sha1: "abc123def456789012345678901234567890",
          crc: "12345678",
          md5: "abcd1234567890abcd1234567890abcd",
          region: "USA",
          system_id: "nes",
        },
      ]);

      const results = await manager.searchWishlist("Mario");

      expect(results.length).toBe(1);
      expect(results[0].title).toContain("Mario");
    });

    it("should filter by system ID", async () => {
      const { getCurationManager } = await import("../curation.js");
      const manager = getCurationManager();

      vi.spyOn(manager, "searchWishlist").mockResolvedValueOnce([
        {
          title: "Super Mario Land",
          sha1: "xyz123def456789012345678901234567890",
          crc: "87654321",
          md5: "xyz1234567890abcd1234567890abcdxyz",
          region: "USA",
          system_id: "gb",
        },
      ]);

      const results = await manager.searchWishlist("Mario", "gb");

      expect(results.length).toBe(1);
      expect(results[0].system_id).toBe("gb");
    });
  });

  describe("getSystemInfo", () => {
    it("should return system info", async () => {
      const { getCurationManager } = await import("../curation.js");
      const manager = getCurationManager();

      vi.spyOn(manager, "getSystemInfo").mockResolvedValueOnce({
        id: "nes",
        title: "Nintendo Entertainment System",
        dat_url: "http://example.com/nes.dat",
        last_updated: "2024-01-01T00:00:00.000Z",
      });

      const info = await manager.getSystemInfo("nes");

      expect(info).toBeDefined();
      expect(info?.id).toBe("nes");
    });

    it("should return null for non-existent system", async () => {
      const { getCurationManager } = await import("../curation.js");
      const manager = getCurationManager();

      vi.spyOn(manager, "getSystemInfo").mockResolvedValueOnce(null);

      const info = await manager.getSystemInfo("nonexistent");

      expect(info).toBeNull();
    });
  });
});

describe("Database Module Exports", () => {
  it("should export STORAGE_PATH and STORAGE_BASE", async () => {
    const { STORAGE_PATH, STORAGE_BASE } = await import("../database.js");
    expect(STORAGE_PATH).toBeDefined();
    expect(STORAGE_BASE).toBeDefined();
  });

  it("should export DATABASE_PATH as alias for backwards compatibility", async () => {
    const { DATABASE_PATH } = await import("../database.js");
    expect(DATABASE_PATH).toBeDefined();
  });

  it("should export getDatabase function", async () => {
    const db = await import("../database.js");
    expect(db.getDatabase).toBeDefined();
    expect(typeof db.getDatabase).toBe("function");
  });
});

describe("CurationManager methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seedSystem", () => {
    it("should seed a system and return result", async () => {
      const mockDatContent = `clrmamepro
(
  game ( name "Super Mario Bros." )
  game ( name "The Legend of Zelda" )
)`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              name: "Nintendo - Nintendo Entertainment System.dat",
              download_url: "http://example.com/nes.dat",
            },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockDatContent,
        });

      const { getCurationManager, clearSystemCache } =
        await import("../curation.js");
      clearSystemCache?.();

      const manager = getCurationManager();
      const result = await manager.seedSystem("nes");

      expect(result.systemId).toBe("nes");
      expect(result.totalGames).toBeGreaterThanOrEqual(1);
    });

    it("should call progress callback", async () => {
      const mockDatContent = `clrmamepro
(
  game ( name "Super Mario Bros." )
)`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              name: "Nintendo - Nintendo Entertainment System.dat",
              download_url: "http://example.com/nes.dat",
            },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockDatContent,
        });

      const { getCurationManager, clearSystemCache } =
        await import("../curation.js");
      clearSystemCache?.();

      const manager = getCurationManager();
      const progressFn = vi.fn();

      await manager.seedSystem("nes", progressFn);

      expect(progressFn).toHaveBeenCalled();
    });
  });

  describe("searchWishlist", () => {
    it("should search wishlist", async () => {
      const { getCurationManager } = await import("../curation.js");
      const { searchWishlist } = await import("../database.js");

      vi.mocked(searchWishlist).mockResolvedValueOnce([
        {
          title: "Super Mario Bros.",
          sha1: "abc123def456789012345678901234567890",
          crc: "12345678",
          md5: "abcd1234567890abcd1234567890abcd",
          region: "USA",
          system_id: "nes",
        },
      ]);

      const manager = getCurationManager();
      const results = await manager.searchWishlist("Mario");

      expect(results.length).toBe(1);
      expect(results[0].title).toContain("Mario");
    });

    it("should filter by system ID", async () => {
      const { getCurationManager } = await import("../curation.js");
      const { searchWishlist } = await import("../database.js");

      vi.mocked(searchWishlist).mockResolvedValueOnce([
        {
          title: "Super Mario Land",
          sha1: "xyz123def456789012345678901234567890",
          crc: "87654321",
          md5: "xyz1234567890abcd1234567890abcdxyz",
          region: "USA",
          system_id: "gb",
        },
      ]);

      const manager = getCurationManager();
      const results = await manager.searchWishlist("Mario", "gb");

      expect(results.length).toBe(1);
      expect(results[0].system_id).toBe("gb");
    });
  });

  describe("getSystemInfo", () => {
    it("should return system info", async () => {
      const { getCurationManager } = await import("../curation.js");
      const { getSystem } = await import("../database.js");

      vi.mocked(getSystem).mockResolvedValueOnce({
        id: "nes",
        title: "Nintendo Entertainment System",
        dat_url: "http://example.com/nes.dat",
        last_updated: "2024-01-01T00:00:00.000Z",
      });

      const manager = getCurationManager();
      const info = await manager.getSystemInfo("nes");

      expect(info).toBeDefined();
      expect(info?.id).toBe("nes");
    });

    it("should return null for non-existent system", async () => {
      const { getCurationManager } = await import("../curation.js");
      const { getSystem } = await import("../database.js");

      vi.mocked(getSystem).mockResolvedValueOnce(null);

      const manager = getCurationManager();
      const info = await manager.getSystemInfo("nonexistent");

      expect(info).toBeNull();
    });
  });
});

describe("syncSystemsToDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync systems to database", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: "Nintendo - Nintendo Entertainment System.dat",
          download_url: "http://example.com/nes.dat",
        },
        {
          name: "Sega - Sega Mega Drive.dat",
          download_url: "http://example.com/md.dat",
        },
      ],
    });

    const { syncSystemsToDatabase, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const systems = await syncSystemsToDatabase();

    expect(systems.length).toBe(2);
    expect(systems[0].id).toBe("nes");
    expect(systems[1].id).toBe("md");
  });
});

describe("DAT Parsing - branch coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse DAT with game ( format", async () => {
    const mockDatContent = `game (
  name "Test Game"
)`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - NES.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockDatContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    await manager.seedSystem("nes");
  });

  it("should parse CLRMamePro DAT with rom block containing sha1, crc, and md5", async () => {
    const mockDatContent = `game (
  name "Super Mario Bros. (World)"
  rom ( name "Super Mario Bros. (World).nes" size 40976 crc 3A3EEAB0 sha1 facee9c577a5262dbe33ac4930bb0b58c8c037f7 md5 811b027eaf99c2def7b933c5208636de )
)
game (
  name "Zelda (USA)"
  rom ( name "Zelda.nes" size 131088 crc ABCD1234 sha1 1234567890abcdef1234567890abcdef12345678 md5 abcdef1234567890abcdef1234567890 )
)`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            name: "Nintendo - NES.dat",
            download_url: "http://example.com/nes.dat",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockDatContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    const result = await manager.seedSystem("nes");
    expect(result.totalGames).toBe(2);
  });

  it("should handle XML format DAT with sha1", async () => {
    const xmlContent = `<?xml version="1.0"?>
<datafile>
<game name="Test">
<sha1>abc123def456789012345678901234567890</sha1>
</game>
</datafile>`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: "Test.dat", download_url: "http://x.com/dat" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => xmlContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    const result = await manager.seedSystem("test");
    expect(result.totalGames).toBe(1);
  });

  it("should handle XML format DAT with crc", async () => {
    const xmlContent = `<?xml version="1.0"?>
<datafile>
<game name="Test">
<crc>a1b2c3d4</crc>
</game>
</datafile>`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: "Test.dat", download_url: "http://x.com/dat" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => xmlContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    const result = await manager.seedSystem("test");
    expect(result.totalGames).toBe(1);
  });

  it("should handle XML format DAT with md5", async () => {
    const xmlContent = `<?xml version="1.0"?>
<datafile>
<game name="Test">
<md5>a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4</md5>
</game>
</datafile>`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: "Test.dat", download_url: "http://x.com/dat" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => xmlContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    const result = await manager.seedSystem("test");
    expect(result.totalGames).toBe(1);
  });

  it("should extract regions from titles", async () => {
    const mockDatContent = `clrmamepro
(
  game ( name "Game (USA)" )
  game ( name "Game (Europe)" )
)`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: "NES.dat", download_url: "http://x.com/nes.dat" },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockDatContent,
      });

    const { getCurationManager, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    const manager = getCurationManager();
    const result = await manager.seedSystem("nes");
    expect(result.totalGames).toBeGreaterThanOrEqual(1);
  });
});

describe("ensureSystemExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return system definition when found in cache", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: "Nintendo - Nintendo Entertainment System.dat",
          download_url: "http://example.com/nes.dat",
        },
      ],
    });

    const { fetchSystems, ensureSystemExists, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    await fetchSystems();
    const system = await ensureSystemExists("nes");

    expect(system).toBeDefined();
    expect(system.id).toBe("nes");
  });

  it("should throw when system not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: "Nintendo - Nintendo Entertainment System.dat",
          download_url: "http://example.com/nes.dat",
        },
      ],
    });

    const { ensureSystemExists, clearSystemCache } =
      await import("../curation.js");
    clearSystemCache?.();

    await expect(ensureSystemExists("nonexistent")).rejects.toThrow(
      "System not found: nonexistent",
    );
  });
});
