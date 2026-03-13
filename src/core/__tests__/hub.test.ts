import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoreHub, hub } from "../hub.js";
import { Curator, MountStatus } from "../curator.js";

vi.mock("../curator.js", () => ({
  Curator: {
    mount: vi.fn(),
    unmount: vi.fn(),
    listMounts: vi.fn(),
    getMount: vi.fn(),
  },
  MountStatus: {
    Active: "active",
    Inactive: "inactive",
    Error: "error",
  },
}));

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

      vi.mocked(Curator.mount).mockResolvedValueOnce(mockMount);

      const request = {
        method: "curator:mount",
        params: { path: "/test/library" },
        id: 1,
      };

      const response = await hub.handleRequest(request);

      expect(response.result).toEqual(mockMount);
      expect(Curator.mount).toHaveBeenCalledWith("/test/library");
    });

    it("should handle curator:mount with error", async () => {
      vi.mocked(Curator.mount).mockRejectedValueOnce(new Error("Invalid path"));

      const request = {
        method: "curator:mount",
        params: { path: "/invalid" },
        id: 1,
      };

      const response = await hub.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toBe("Invalid path");
    });
  });

  describe("curator:unmount", () => {
    it("should handle curator:unmount request", async () => {
      vi.mocked(Curator.unmount).mockResolvedValueOnce(undefined);

      const request = {
        method: "curator:unmount",
        params: { path: "/test/library" },
        id: 2,
      };

      const response = await hub.handleRequest(request);

      expect(response.result).toEqual({ success: true });
      expect(Curator.unmount).toHaveBeenCalledWith("/test/library");
    });

    it("should handle curator:unmount with error", async () => {
      vi.mocked(Curator.unmount).mockRejectedValueOnce(
        new Error("Mount not found"),
      );

      const request = {
        method: "curator:unmount",
        params: { path: "/nonexistent" },
        id: 2,
      };

      const response = await hub.handleRequest(request);

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

      vi.mocked(Curator.listMounts).mockResolvedValueOnce(mockMounts);

      const request = {
        method: "curator:list",
        id: 3,
      };

      const response = await hub.handleRequest(request);

      expect(response.result).toEqual(mockMounts);
      expect(Curator.listMounts).toHaveBeenCalled();
    });

    it("should return empty array when no mounts exist", async () => {
      vi.mocked(Curator.listMounts).mockResolvedValueOnce([]);

      const request = {
        method: "curator:list",
        id: 3,
      };

      const response = await hub.handleRequest(request);

      expect(response.result).toEqual([]);
    });

    it("should handle curator:mount with missing path", async () => {
      const request = {
        method: "curator:mount",
        params: {},
        id: 4,
      };
      const response = await hub.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain("Missing required parameter: path");
    });

    it("should handle curator:unmount with missing path", async () => {
      const request = {
        method: "curator:unmount",
        params: {},
        id: 5,
      };
      const response = await hub.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain("Missing required parameter: path");
    });

    it("should handle unknown method", async () => {
      const request = {
        method: "unknown",
        id: 6,
      };
      const response = await hub.handleRequest(request);
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

      const response = await hub.handleRequest(request);

      expect(response.result).toHaveProperty("running");
      expect(response.result).toHaveProperty("socketPath");
      expect(response.result).toHaveProperty("storagePath");
    });

    it("should handle ping request", async () => {
      const request = {
        method: "ping",
        id: 5,
      };

      const response = await hub.handleRequest(request);

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
});
