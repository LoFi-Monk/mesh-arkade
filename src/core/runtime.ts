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
 * @constraint Stream-based fs APIs are fully supported in both runtimes.
 */
export function getFs (): typeof fs {
  return fs
}

/**
 * @intent   Check if a path exists (file or directory) reliably across Bare and Node runtimes.
 * @guarantee Returns true if the path exists (either as file or directory), false otherwise.
 * @constraint Uses try/catch with fs.statSync pattern for maximum compatibility in Pear/Bare runtime.
 */
export function pathExists (filePath: string): boolean {
  try {
    fs.statSync(filePath)
    return true
  } catch {
    return false
  }
}
