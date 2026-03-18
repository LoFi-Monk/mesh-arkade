import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchManager } from "../fetch-manager.js";
import { AllLayersFailedError, FetchLayerError } from "../errors.js";

vi.mock("../../core/runtime.js", () => ({
  getFs: vi.fn().mockResolvedValue({
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  }),
  getPath: vi.fn().mockResolvedValue({
    join: vi.fn((...args) => args.join("/")),
  }),
}));

describe("FetchManager Coverage Extensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchAndStage - record exists but has no title", async () => {
     const manager = new FetchManager();
     // Mock fetch to return some data
     (manager as any).fetch = vi.fn().mockResolvedValue(new Uint8Array([1,2,3]));
     
     const filename = await manager.fetchAndStage("abc", "/tmp", [{ sha1: "abc" } as any]);
     expect(filename).toBe("abc.bin");
  });

  it("fetchAndStage - record exists with empty title", async () => {
     const manager = new FetchManager();
     (manager as any).fetch = vi.fn().mockResolvedValue(new Uint8Array([1,2,3]));
     
     const filename = await manager.fetchAndStage("abc", "/tmp", [{ sha1: "abc", title: "" } as any]);
     expect(filename).toBe("abc.bin");
  });
});
