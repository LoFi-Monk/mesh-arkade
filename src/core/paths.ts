/**
 * @file paths.ts
 * @description Storage path utilities for Pear and Node.js environments.
 */

interface PearAppWithStorage {
  args: string[];
  key: string | null;
  dev: boolean;
  storage?: string;
}

/**
 * @intent Returns the base storage directory for all persistent app data.
 * @guarantee Returns Pear.app.storage when running inside the Pear runtime; falls back to "./data" otherwise.
 * @constraint Must remain a leaf function with no src/ imports to prevent circular dependencies.
 */
function getStorageBasePath(): string {
  const pearApp =
    typeof Pear !== "undefined" ? (Pear.app as PearAppWithStorage) : null;
  if (pearApp?.storage) {
    return pearApp.storage;
  }
  return "./data";
}

export { getStorageBasePath };
