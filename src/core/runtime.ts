/**
 * @file runtime.ts
 * @description Runtime abstraction layer for Bare and Node.js environments.
 */

let cachedFs: typeof import("fs") | null = null;
let cachedPath: typeof import("path") | null = null;
let cachedOs: typeof import("os") | null = null;
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

let cachedFetch: typeof fetch | null = null;
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
