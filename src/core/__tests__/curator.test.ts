import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fsPromisesMock = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  rmdir: vi.fn(),
  unlink: vi.fn(),
  access: vi.fn(),
  constants: { R_OK: 0 },
};

vi.mock("fs/promises", () => ({
  ...fsPromisesMock,
  default: fsPromisesMock,
}));

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
}));

const mockPearApp = {
  args: [],
  key: null,
  dev: true,
  storage: "./test-storage",
};

vi.stubGlobal("Pear", {
  app: mockPearApp,
});

vi.stubGlobal(
  "Hypercore",
  vi.fn().mockImplementation(() => ({
    ready: vi.fn().mockResolvedValue(undefined),
    append: vi.fn().mockResolvedValue(1),
    close: vi.fn().mockResolvedValue(undefined),
    length: 0,
  })),
);

vi.stubGlobal(
  "Corestore",
  vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue({
      ready: vi.fn().mockResolvedValue(undefined),
    }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
);

describe("Curator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Mount interface", () => {
    it("should export MountStatus enum values", async () => {
      const curator = await import("../curator.js");
      expect(curator.MountStatus).toBeDefined();
      expect(curator.MountStatus.Active).toBe("active");
      expect(curator.MountStatus.Inactive).toBe("inactive");
      expect(curator.MountStatus.Error).toBe("error");
    });
  });

  describe("mounts.json persistence", () => {
    it("should load mounts from storage", async () => {
      fsPromisesMock.readFile.mockResolvedValueOnce(JSON.stringify([]));

      const { loadMounts } = await import("../storage");
      const mounts = await loadMounts();
      expect(mounts).toEqual([]);
    });

    it("should load mounts with existing data", async () => {
      const existingMounts = [
        { path: "/test/path", status: "active", fileCount: 0 },
      ];
      fsPromisesMock.readFile.mockResolvedValueOnce(
        JSON.stringify(existingMounts),
      );

      const { loadMounts } = await import("../storage");
      const mounts = await loadMounts();
      expect(mounts).toEqual(existingMounts);
    });

    it("should save mounts to storage", async () => {
      fsPromisesMock.writeFile.mockResolvedValueOnce(undefined);

      const { saveMounts } = await import("../storage");
      await saveMounts([]);
      expect(fsPromisesMock.writeFile).toHaveBeenCalled();
    });

    it("should handle missing mounts.json gracefully", async () => {
      fsPromisesMock.readFile.mockRejectedValueOnce(
        new Error("ENOENT: no such file"),
      );

      const { loadMounts } = await import("../storage");
      const mounts = await loadMounts();
      expect(mounts).toEqual([]);
    });
  });

  describe("Curator.mount(path)", () => {
    it("should export mount function", async () => {
      const { Curator } = await import("../curator");
      expect(Curator).toBeDefined();
      expect(typeof Curator.mount).toBe("function");
    });

    it("should validate path exists and is a directory", async () => {
      const { Curator } = await import("../curator");
      const fs = await import("fs/promises");

      fsPromisesMock.stat.mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory"),
      );

      await expect(Curator.mount("/nonexistent/path")).rejects.toThrow();
    });

    it("should create .mesh-hub directory on mount", async () => {
      const { Curator } = await import("../curator");
      const fs = await import("fs/promises");

      fsPromisesMock.stat.mockResolvedValueOnce({ isDirectory: () => true });
      fsPromisesMock.access.mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory"),
      );
      fsPromisesMock.mkdir.mockResolvedValueOnce(undefined);

      await Curator.mount("/test/library");

      expect(fsPromisesMock.mkdir).toHaveBeenCalled();
    });

    it("should add mount to mounts.json", async () => {
      const { Curator } = await import("../curator");
      const fs = await import("fs/promises");

      fsPromisesMock.stat.mockResolvedValue({ isDirectory: () => true });
      fsPromisesMock.access.mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory"),
      );
      fsPromisesMock.mkdir.mockResolvedValueOnce(undefined);
      fsPromisesMock.readFile.mockResolvedValueOnce(JSON.stringify([]));
      fsPromisesMock.writeFile.mockResolvedValueOnce(undefined);

      const result = await Curator.mount("/test/library");

      expect(result).toBeDefined();
      expect(result.path).toBe("/test/library");
    });
  });

  describe("Curator.unmount(path)", () => {
    it("should export unmount function", async () => {
      const { Curator } = await import("../curator");
      expect(typeof Curator.unmount).toBe("function");
    });

    it("should remove mount from mounts.json", async () => {
      const { Curator } = await import("../curator");

      fsPromisesMock.readFile.mockResolvedValueOnce(
        JSON.stringify([{ path: "/test/library", status: "active" }]),
      );
      fsPromisesMock.writeFile.mockResolvedValueOnce(undefined);

      await Curator.unmount("/test/library");

      expect(fsPromisesMock.writeFile).toHaveBeenCalled();
    });

    it("should handle non-existent mount", async () => {
      const { Curator } = await import("../curator");

      fsPromisesMock.readFile.mockResolvedValueOnce(JSON.stringify([]));

      await expect(Curator.unmount("/nonexistent")).rejects.toThrow();
    });
  });

  describe("Curator.listMounts()", () => {
    it("should export listMounts function", async () => {
      const { Curator } = await import("../curator");
      expect(typeof Curator.listMounts).toBe("function");
    });

    it("should return all active mounts", async () => {
      const { Curator } = await import("../curator");

      fsPromisesMock.readFile.mockResolvedValueOnce(
        JSON.stringify([
          { path: "/test/library1", status: "active" },
          { path: "/test/library2", status: "inactive" },
        ]),
      );

      const mounts = await Curator.listMounts();

      expect(mounts).toHaveLength(2);
      expect(mounts[0].path).toBe("/test/library1");
    });
  });
});
