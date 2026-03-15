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

function getStorageBasePath(): string {
  const pearApp =
    typeof Pear !== "undefined" ? (Pear.app as PearAppWithStorage) : null;
  if (pearApp?.storage) {
    return pearApp.storage;
  }
  return "./data";
}

export { getStorageBasePath };
