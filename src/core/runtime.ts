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
 * Only the single-chain pattern createHash(algo).update(data).digest(encoding) is supported.
 * Multi-step update() chaining is not supported.
 */
type CryptoModule = {
  createHash: (algo: string) => {
    update: (data: Buffer | Uint8Array | string) => {
      digest: (encoding: string) => string;
    };
  };
};

let cachedCrypto: CryptoModule | null = null;
let cryptoResolved = false;

/**
 * @intent Returns a crypto module appropriate for the current runtime (bare-crypto in Bare, Node crypto otherwise).
 * @guarantee Result is cached after first resolution — subsequent calls return the same reference without re-importing.
 */
export async function getCrypto(): Promise<CryptoModule> {
  if (cryptoResolved && cachedCrypto) return cachedCrypto;

  if (typeof Bare !== "undefined") {
    const bareCrypto = await import("bare-crypto");
    cachedCrypto = {
      createHash: (algo: string) => {
        const hash = bareCrypto.createHash(algo);
        return {
          update: (data: Buffer | Uint8Array | string) => {
            hash.update(data);
            return {
              digest: (encoding: string) => hash.digest(encoding),
            };
          },
          digest: (encoding: string) => hash.digest(encoding),
        };
      },
    };
  } else {
    const nodeCrypto = await import("crypto");
    cachedCrypto = {
      createHash: (algo: string) => {
        const hash = nodeCrypto.createHash(algo);
        return {
          update: (data: Buffer | Uint8Array | string) => {
            hash.update(data);
            return {
              digest: (encoding: string) => hash.digest(encoding as "hex"),
            };
          },
          digest: (encoding: string) => hash.digest(encoding as "hex"),
        };
      },
    };
  }

  cryptoResolved = true;
  return cachedCrypto;
}
