import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoreHub, getEngineHub } from "../hub.js";
import { MountStatus } from "../curator.js";
const mockCurator = {
  mount: vi.fn(),
  unmount: vi.fn(),
  listMounts: vi.fn(),
  getMount: vi.fn(),
};

vi.mock("../curator.js", async () => {
  const actual = await vi.importActual("../curator.js");
  return {
    ...actual,
    getCurator: () => mockCurator,
  };
});

vi.mock("../curation.js", async () => {
  return {
    getCurationManager: () => ({
      seedSystem: vi.fn().mockResolvedValue({
        systemId: "nes",
        systemTitle: "Nintendo Entertainment System",
        gamesAdded: 10,
        totalGames: 10,
      }),
      searchWishlist: vi.fn().mockResolvedValue([
        {
          title: "Super Mario Bros.",
          sha1: "abc123",
          crc: "12345678",
          md5: "abcd1234",
          region: "USA",
          system_id: "nes",
        },
      ]),
      getSupportedSystems: vi
        .fn()
        .mockResolvedValue([
          { id: "nes", title: "NES", datUrl: "http://example.com/nes.dat" },
        ]),
      getSystemInfo: vi.fn().mockResolvedValue(null),
    }),
  };
});

vi.stubGlobal("Pear", {
  app: {
    args: ["--bare"],
    key: null,
    dev: true,
    storage: "./test-storage",
  },
});

describe("CoreHub JSON-RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CoreHub.resetInstance();
  });

  describe("curator:mount", () => {
    it("should handle curator:mount request", async () => {
      const mockMount = {
        path: "/test/library",
        status: MountStatus.Active,
        fileCount: 10,
        createdAt: "2024-01-01T00:00:00.000Z",
        lastIndexed: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(mockCurator.mount).mockResolvedValueOnce(mockMount);

      const request = {
        method: "curator:mount",
        params: { path: "/test/library" },
        id: 1,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toEqual(mockMount);
      expect(mockCurator.mount).toHaveBeenCalledWith("/test/library");
    });

    it("should handle curator:mount with error", async () => {
      vi.mocked(mockCurator.mount).mockRejectedValueOnce(
        new Error("Invalid path"),
      );

      const request = {
        method: "curator:mount",
        params: { path: "/invalid" },
        id: 1,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe("Invalid path");
    });
  });

  describe("curator:unmount", () => {
    it("should handle curator:unmount request", async () => {
      vi.mocked(mockCurator.unmount).mockResolvedValueOnce(undefined);

      const request = {
        method: "curator:unmount",
        params: { path: "/test/library" },
        id: 2,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toEqual({ success: true });
      expect(mockCurator.unmount).toHaveBeenCalledWith("/test/library");
    });

    it("should handle curator:unmount with error", async () => {
      vi.mocked(mockCurator.unmount).mockRejectedValueOnce(
        new Error("Mount not found"),
      );

      const request = {
        method: "curator:unmount",
        params: { path: "/nonexistent" },
        id: 2,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe("Mount not found");
    });
  });

  describe("curator:list", () => {
    it("should handle curator:list request", async () => {
      const mockMounts = [
        {
          path: "/test/library1",
          status: MountStatus.Active,
          fileCount: 10,
        },
        {
          path: "/test/library2",
          status: MountStatus.Active,
          fileCount: 5,
        },
      ];

      vi.mocked(mockCurator.listMounts).mockResolvedValueOnce(mockMounts);

      const request = {
        method: "curator:list",
        id: 3,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toEqual(mockMounts);
      expect(mockCurator.listMounts).toHaveBeenCalled();
    });

    it("should return empty array when no mounts exist", async () => {
      vi.mocked(mockCurator.listMounts).mockResolvedValueOnce([]);

      const request = {
        method: "curator:list",
        id: 3,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toEqual([]);
    });

    it("should handle curator:mount with missing path", async () => {
      const request = {
        method: "curator:mount",
        params: {},
        id: 4,
      };
      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain(
        "Missing required parameter: path",
      );
    });

    it("should handle curator:unmount with missing path", async () => {
      const request = {
        method: "curator:unmount",
        params: {},
        id: 5,
      };
      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain(
        "Missing required parameter: path",
      );
    });

    it("should handle unknown method", async () => {
      const request = {
        method: "unknown",
        id: 6,
      };
      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain("Unknown method");
    });
  });

  describe("environment and paths", () => {
    it("should use storage from Pear if available", async () => {
      vi.stubGlobal("Pear", { app: { storage: "/pear-path" } });
      CoreHub.resetInstance();
      const h = CoreHub.getInstance();
      await h.start();
      expect(h.getStoragePath()).toBe("/pear-path");
    });

    it("should default storage to ./data if Pear storage is missing", async () => {
      vi.stubGlobal("Pear", { app: {} });
      CoreHub.resetInstance();
      const h = CoreHub.getInstance();
      await h.start();
      expect(h.getStoragePath()).toBe("./data");
    });

    it("should use backslash separator for Windows-like paths", async () => {
      vi.stubGlobal("Pear", { app: { storage: "C:\\path" } });
      CoreHub.resetInstance();
      const h = CoreHub.getInstance();
      await h.start();
      expect(h.getSocketPath()).toBe("C:\\path\\mesharkade.sock");
    });

    it("should use forward slash separator for Unix-like paths", async () => {
      vi.stubGlobal("Pear", { app: { storage: "/path" } });
      CoreHub.resetInstance();
      const h = CoreHub.getInstance();
      await h.start();
      expect(h.getSocketPath()).toBe("/path/mesharkade.sock");
    });
  });

  describe("status and ping", () => {
    it("should handle status request", async () => {
      const request = {
        method: "status",
        id: 4,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toHaveProperty("running");
      expect(response.result).toHaveProperty("socketPath");
      expect(response.result).toHaveProperty("storagePath");
    });

    it("should handle ping request", async () => {
      const request = {
        method: "ping",
        id: 5,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toEqual({ pong: true });
    });

    it("should be idempotent on start and stop", async () => {
      const h = CoreHub.getInstance();
      await h.start();
      await h.start(); // Second start should return early
      expect(h.getStatus().running).toBe(true);
      await h.stop();
      await h.stop(); // Second stop should return early
      expect(h.getStatus().running).toBe(false);
    });
  });

  describe("curation:seed", () => {
    it("should handle curation:seed request", async () => {
      const request = {
        method: "curation:seed",
        params: { system: "nes" },
        id: 10,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as { systemId: string }).systemId).toBe("nes");
    });

    it("should handle curation:seed with missing system", async () => {
      const request = {
        method: "curation:seed",
        params: {},
        id: 11,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain(
        "Missing required parameter: system",
      );
    });

    it("should handle curation:seed with invalid params", async () => {
      const request = {
        method: "curation:seed",
        params: { invalid: true },
        id: 12,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
    });
  });

  describe("curation:search", () => {
    it("should handle curation:search request", async () => {
      const request = {
        method: "curation:search",
        params: { query: "Mario" },
        id: 13,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toBeInstanceOf(Array);
    });

    it("should handle curation:search with system filter", async () => {
      const request = {
        method: "curation:search",
        params: { query: "Mario", system: "nes" },
        id: 14,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toBeInstanceOf(Array);
    });

    it("should handle curation:search with limit", async () => {
      const request = {
        method: "curation:search",
        params: { query: "Mario", limit: 5 },
        id: 15,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toBeInstanceOf(Array);
    });

    it("should handle curation:search with missing query", async () => {
      const request = {
        method: "curation:search",
        params: {},
        id: 16,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain(
        "Missing required parameter: query",
      );
    });

    it("should handle curation:search with invalid params", async () => {
      const request = {
        method: "curation:search",
        params: { invalid: true },
        id: 17,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.error).toBeDefined();
    });
  });

  describe("curation:systems", () => {
    it("should handle curation:systems request", async () => {
      const request = {
        method: "curation:systems",
        id: 18,
      };

      const engineHub = getEngineHub();
      const response = await engineHub.handleRequest(request);

      expect(response.result).toBeInstanceOf(Array);
    });
  });
});
