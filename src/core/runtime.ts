import * as fs from 'fs'

/**
 * @intent   Provide a single access point for the global fetch function across Bare and Node runtimes.
 * @guarantee Returns the globalThis.fetch polyfilled by compat.js at app startup.
 * @constraint compat.js must be imported before any call to getFetch — polyfill is not applied lazily.
 */
export function getFetch (): typeof fetch {
  return globalThis.fetch
}

/**
 * @intent   Provide a single access point for the filesystem module across Bare and Node runtimes.
 * @guarantee Returns the fs module — resolves to bare-node-fs in Bare, the built-in fs in Node, via package.json imports alias.
 * @constraint Callers must not assume stream-based fs APIs are available — use callback or promise variants only.
 */
export function getFs (): typeof fs {
  return fs
}
