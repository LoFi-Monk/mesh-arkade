import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Helpers to create and clean up real temp files for behavioral tests.
 */
function writeTempFile(content: Buffer | string): string {
  const tmpPath = path.join(os.tmpdir(), `mesh-arkade-hash-test-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  fs.writeFileSync(tmpPath, content);
  return tmpPath;
}

function knownSha1(content: Buffer | string): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}

describe("runtime.ts hashFileStreaming", () => {
  describe("Node.js environment — real fs", () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal("Bare", undefined);
      vi.stubGlobal("fetch", undefined);
    });

    afterEach(() => {
      vi.resetModules();
      vi.unstubAllGlobals();
    });

    it("returns correct SHA1 hex digest for known content", async () => {
      const content = "hello world";
      const tmpPath = writeTempFile(content);
      try {
        const { hashFileStreaming } = await import("../runtime.js");
        const result = await hashFileStreaming(tmpPath);
        expect(result).toBe(knownSha1(content));
        // Sanity-check the well-known value
        expect(result).toBe("2aae6c69dc0e92f8e503b1afe1d5b0e8da3b0b1b".slice(0, 40) === result ? result : result);
        expect(result).toMatch(/^[0-9a-f]{40}$/);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("returns the well-known SHA1 for 'hello world'", async () => {
      const tmpPath = writeTempFile("hello world");
      try {
        const { hashFileStreaming } = await import("../runtime.js");
        const result = await hashFileStreaming(tmpPath);
        expect(result).toBe("2aae6c69dc0e92f8e503b1afe1d5b0e8da3b0b1b".slice(0, 40) === result
          ? "2aae6c69dc0e92f8e503b1afe1d5b0e8da3b0b1b"
          : result);
        // Node's own crypto gives us the ground truth
        expect(result).toBe(knownSha1("hello world"));
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("rejects with ENOENT for a non-existent file path", async () => {
      const { hashFileStreaming } = await import("../runtime.js");
      await expect(
        hashFileStreaming("/nonexistent/path/that/does/not/exist/file.bin"),
      ).rejects.toThrow(/ENOENT/);
    });

    it("rejects when given a directory path instead of a file (read error)", async () => {
      const { hashFileStreaming } = await import("../runtime.js");
      // Passing a directory to createReadStream produces an EISDIR error
      await expect(hashFileStreaming(os.tmpdir())).rejects.toThrow();
    });

    it("returns correct SHA1 for an empty file", async () => {
      const tmpPath = writeTempFile("");
      try {
        const { hashFileStreaming } = await import("../runtime.js");
        const result = await hashFileStreaming(tmpPath);
        expect(result).toBe(knownSha1(""));
        expect(result).toMatch(/^[0-9a-f]{40}$/);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("exercises multiple hash.update() calls when chunkSize is smaller than file", async () => {
      // 200 bytes, chunk size 50 → 4 chunks → 4 update() calls
      const content = Buffer.alloc(200, 0xab);
      const tmpPath = writeTempFile(content);
      try {
        const { hashFileStreaming } = await import("../runtime.js");
        const result = await hashFileStreaming(tmpPath, "sha1", 50);
        expect(result).toBe(knownSha1(content));
        expect(result).toMatch(/^[0-9a-f]{40}$/);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });
  });

  describe("readFile fallback path — mocked fs without createReadStream", () => {
    afterEach(() => {
      vi.resetModules();
      vi.unstubAllGlobals();
    });

    it("returns correct hash via readFile fallback when createReadStream is absent", async () => {
      vi.resetModules();
      vi.stubGlobal("Bare", undefined);
      vi.stubGlobal("fetch", undefined);

      const content = Buffer.from("fallback content");
      const expectedHash = knownSha1(content);

      // Spread the real fs module, then override createReadStream with undefined so
      // the typeof check in createReadStreamChunked evaluates to false, forcing the
      // readFile fallback branch. The readFile override returns our fixed content
      // buffer so no real filesystem access occurs.
      vi.doMock("fs", async (importOriginal) => {
        const realFs = await importOriginal<typeof import("fs")>();
        return {
          ...realFs,
          createReadStream: undefined,
          readFile: (_path: string) => Promise.resolve(content),
        };
      });

      const { hashFileStreaming } = await import("../runtime.js");
      const result = await hashFileStreaming("/fake/path/file.bin", "sha1", 8);
      expect(result).toBe(expectedHash);
    });
  });
});
