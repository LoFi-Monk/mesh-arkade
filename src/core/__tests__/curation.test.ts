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
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
}));

vi.mock("corestore", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
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
  });

  describe("getSupportedSystems", () => {
    it("should return systems from fetchSystems", async () => {
      mockFetch.mockResolvedValueOnce({
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

  it("should export getDatabase function", async () => {
    const db = await import("../database.js");
    expect(db.getDatabase).toBeDefined();
    expect(typeof db.getDatabase).toBe("function");
  });
});

describe("DAT Parsing", () => {
  it("should fetch DAT from GitHub API download URL", async () => {
    mockFetch.mockResolvedValueOnce({
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
    const nes = systems.find((s) => s.id === "nes");

    expect(nes?.datUrl).toBe("http://example.com/nes.dat");
  });

  it("should handle multiple system formats", async () => {
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
        {
          name: "Nintendo - Game Boy.dat",
          download_url: "http://example.com/gb.dat",
        },
      ],
    });

    const { fetchSystems, clearSystemCache } = await import("../curation.js");
    clearSystemCache?.();
    const systems = await fetchSystems();

    const ids = systems.map((s) => s.id);
    expect(ids).toContain("nes");
    expect(ids).toContain("md");
    expect(ids).toContain("gb");
  });
});
