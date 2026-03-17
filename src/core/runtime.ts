/**
 * @file runtime.ts
 * @description Runtime abstraction layer for Bare and Node.js environments.
 */

// Cache variables use `any` because bare-fs/bare-path/bare-os have narrower
// type surfaces than Node's built-ins. Strict typing would require union types
// that don't exist yet in the Bare ecosystem. Will tighten as Bare types mature.
let cachedFs: any = null;
let cachedPath: any = null;
let cachedOs: any = null;
let runtimeResolved = false;

async function ensureRuntime(): Promise<void> {
  if (runtimeResolved) return;

  if (typeof Bare !== "undefined") {
    cachedFs = (await import("bare-fs")).default;
    cachedPath = (await import("bare-path")).default;
    cachedOs = (await import("bare-os")).default;
  } else {
    cachedFs = await import("fs");
    cachedPath = await import("path");
    cachedOs = await import("os");
  }

  runtimeResolved = true;
}

/**
 * @intent Returns the fs module appropriate for the current runtime (bare-fs in Bare, Node fs otherwise).
 * @guarantee Result is cached after first resolution — subsequent calls return the same reference without re-importing.
 */
export async function getFs(): Promise<typeof import("fs")> {
  await ensureRuntime();
  return cachedFs;
}

/**
 * @intent Returns the path module appropriate for the current runtime (bare-path in Bare, Node path otherwise).
 * @guarantee Result is cached after first resolution — subsequent calls return the same reference without re-importing.
 */
export async function getPath(): Promise<typeof import("path")> {
  await ensureRuntime();
  return cachedPath;
}

/**
 * @intent Returns the os module appropriate for the current runtime (bare-os in Bare, Node os otherwise).
 * @guarantee Result is cached after first resolution — subsequent calls return the same reference without re-importing.
 */
export async function getOs(): Promise<typeof import("os")> {
  await ensureRuntime();
  return cachedOs;
}

// Same dual-runtime constraint as above — node-fetch's type signature differs from globalThis.fetch.
let cachedFetch: any = null;
let fetchResolved = false;

/**
 * @intent Returns a fetch implementation following the priority chain: bare-fetch (Bare) → globalThis.fetch → node-fetch.
 * @guarantee Result is cached after first resolution; always resolves to a callable fetch function.
 */
export async function getFetch(): Promise<typeof fetch> {
  if (fetchResolved) return cachedFetch;

  if (typeof Bare !== "undefined") {
    cachedFetch = (await import("bare-fetch")).default;
  } else if (typeof globalThis.fetch !== "undefined") {
    cachedFetch = globalThis.fetch;
  } else {
    cachedFetch = (await import("node-fetch")).default;
  }

  fetchResolved = true;
  return cachedFetch;
}

/**
 * Crypto module interface for dual-runtime (Bare/Node) abstraction.
 * The createHash(algo).update(data).digest(encoding) chain pattern and multi-step
 * update() chaining (e.g. hash.update(a).update(b).digest(enc)) are both supported.
 */
type HashObject = {
  update: (data: Buffer | Uint8Array | string) => HashObject;
  digest: (encoding: string) => string;
};

type CryptoModule = {
  createHash: (algo: string) => HashObject;
};

let cachedCrypto: CryptoModule | null = null;
let cryptoResolved = false;

/**
 * @intent Returns a crypto module appropriate for the current runtime (bare-crypto in Bare, Node crypto otherwise).
 * @guarantee Result is cached after first resolution — subsequent calls return the same reference without re-importing.
 * @constraint bare-crypto hash objects support repeated `.update()` calls per the WHATWG/Node hash spec —
 *   each call accumulates data into the running digest state.
 */
export async function getCrypto(): Promise<CryptoModule> {
  if (cryptoResolved && cachedCrypto) return cachedCrypto;

  if (typeof Bare !== "undefined") {
    const bareCrypto = (await import("bare-crypto")).default;
    cachedCrypto = {
      createHash: (algo: string) => {
        const hash = bareCrypto.createHash(algo);
        const obj: HashObject = {
          update: (data: Buffer | Uint8Array | string) => {
            hash.update(data);
            return obj;
          },
          digest: (encoding: string) => hash.digest(encoding),
        };
        return obj;
      },
    };
  } else {
    const nodeCrypto = await import("crypto");
    cachedCrypto = {
      createHash: (algo: string) => {
        const hash = nodeCrypto.createHash(algo);
        const obj: HashObject = {
          update: (data: Buffer | Uint8Array | string) => {
            hash.update(data);
            return obj;
          },
          digest: (encoding: string) => hash.digest(encoding as "hex"),
        };
        return obj;
      },
    };
  }

  cryptoResolved = true;
  return cachedCrypto as CryptoModule;
}

const DEFAULT_CHUNK_SIZE = 64 * 1024;

type FsLike = {
  createReadStream?: (path: string, opts?: { highWaterMark?: number }) => NodeJS.ReadableStream;
  readFile?: (path: string) => Promise<Buffer>;
  promises?: { readFile: (path: string) => Promise<Buffer> };
};

async function createReadStreamChunked(
  fs: FsLike,
  filePath: string,
  chunkSize: number,
  hash: HashObject,
): Promise<void> {
  if (typeof fs.createReadStream === "function") {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, {
        highWaterMark: chunkSize,
      });

      stream.on("data", (chunk: Buffer) => {
        hash.update(chunk);
      });

      stream.on("end", () => {
        resolve();
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  }

  const readFileFn = fs.promises?.readFile ?? fs.readFile;
  if (!readFileFn) {
    throw new Error("fs module exposes neither createReadStream nor readFile");
  }
  const buffer = await readFileFn(filePath);
  for (let i = 0; i < buffer.length; i += chunkSize) {
    hash.update(buffer.slice(i, i + chunkSize));
  }
}

/**
 * @intent Computes a streaming hash digest of a file without loading the entire file into memory.
 * @guarantee Memory usage is bounded to a single chunk at a time when `createReadStream` is
 *   available. The `readFile` fallback loads the full file into memory before chunking — used
 *   when `createReadStream` is unavailable (e.g. bare-fs environments that lack streaming).
 * @constraint getCrypto() and getFs() errors propagate to the caller — callers must handle
 *   rejection for environments where either module is unavailable.
 */
export async function hashFileStreaming(
  filePath: string,
  algorithm: string = "sha1",
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): Promise<string> {
  const crypto = await getCrypto();
  const fs = await getFs();

  const hash = crypto.createHash(algorithm);
  await createReadStreamChunked(fs, filePath, chunkSize, hash);

  return hash.digest("hex");
}
