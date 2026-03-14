/**
 * @file storage.ts
 * @description Storage utilities for Curator mounts management using pear-electron storage.
 */

let fs: any;
let path: any;

if (typeof Bare !== "undefined") {
  fs = (await import("bare-fs")).default;
  path = (await import("bare-path")).default;
} else {
  fs = await import("fs");
  path = await import("path");
}

let storageMutex: Promise<void> = Promise.resolve();
let currentHolder: { release: () => void } | null = null;

/**
 * Executes a function under a mutual exclusion lock for storage operations.
 *
 * @intent Serialize concurrent access to mounts.json to prevent lost updates.
 * @guarantee Only one caller's fn executes at a time; others queue until the lock is released.
 * @constraint Must not be called in a nested fashion — use raw storage helpers inside an outer withMutex block.
 */
async function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  if (currentHolder) {
    return fn();
  }
  const current = storageMutex;
  let release: () => void;
  storageMutex = new Promise<void>((resolve) => {
    release = resolve;
  });
  currentHolder = { release: release! };
  await current;
  try {
    return await fn();
  } finally {
    currentHolder = null;
    release!();
  }
}
export { withMutex };

/**
 * Hidden directory used to store mesh indexing data within libraries.
 *
 * @intent Define the consistent hidden folder name for per-library metadata.
 * @guarantee This constant is used in both storage and curator modules.
 */
export const MESH_HUB_DIR = ".mesh-hub";
/**
 * Filename for the persistent list of library mounts.
 *
 * @intent Define the registration filename for library persistence.
 * @guarantee This file is located within the app storage directory.
 */
export const MOUNTS_FILE = "mounts.json";

interface PearAppWithStorage {
  args: string[];
  key: string | null;
  dev: boolean;
  storage?: string;
}

function getStoragePath(): string {
  const pearApp =
    typeof Pear !== "undefined" ? (Pear.app as PearAppWithStorage) : null;
  if (pearApp?.storage) {
    return pearApp.storage;
  }
  return "./data";
}

/**
 * Ensures the application storage directory exists.
 *
 * @intent Initialize the persistent data directory for the app.
 * @guarantee Returns the absolute path to the verified storage directory.
 */
export async function ensureStorageDir(): Promise<string> {
  const storagePath = getStoragePath();

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  return storagePath;
}

/**
 * Resolves the absolute path to the mounts.json file.
 *
 * @intent Provide a central path resolver for the mounts registry.
 * @guarantee Returns the full path to the mounts persistence file.
 */
export async function getMountsFilePath(): Promise<string> {
  const storagePath = await ensureStorageDir();
  return path.join(storagePath, MOUNTS_FILE);
}

/**
 * Loads the list of library mounts from storage.
 *
 * @intent Retrieve persisted mount configuration.
 * @guarantee Returns an empty array if no mounts exist or file is corrupt.
 */
export async function loadMounts(): Promise<Mount[]> {
  return withMutex(async () => {
    try {
      const mountsPath = await getMountsFilePath();
      const data = await fs.promises.readFile(mountsPath, "utf-8");
      return JSON.parse(data) as Mount[];
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(
          "[Curator] mounts.json is corrupt — returning empty list. Manual recovery may be needed.",
          error.message,
        );
      }
      return [];
    }
  });
}

/**
 * Persists the list of library mounts to storage.
 *
 * @intent Save changes to the user's library configuration.
 * @guarantee Atomically writes the mounts list to disk in JSON format.
 */
export async function saveMounts(mounts: Mount[]): Promise<void> {
  return withMutex(async () => {
    const mountsPath = await getMountsFilePath();
    const tmpPath = `${mountsPath}.tmp`;
    const dir = path.dirname(mountsPath);

    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    await fs.promises.writeFile(
      tmpPath,
      JSON.stringify(mounts, null, 2),
      "utf-8",
    );
    await fs.promises.rename(tmpPath, mountsPath);
  });
}

/**
 * Data model for a library mount entry.
 *
 * @intent Provide a consistent structure for library metadata and indexing status.
 * @guarantee Includes path validation status and file count tracking.
 */
export interface Mount {
  path: string;
  status: MountStatus;
  fileCount: number;
  createdAt?: string;
  lastIndexed?: string;
}

/**
 * Status states for a library mount.
 */
export enum MountStatus {
  Active = "active",
  Inactive = "inactive",
  Error = "error",
}

/**
 * Checks if the mounts registry exists on disk.
 *
 * @intent Determine if the hub has been initialized with libraries.
 * @guarantee Returns true if mounts.json exists and is readable.
 */
export async function mountsFileExists(): Promise<boolean> {
  try {
    const mountsPath = await getMountsFilePath();
    await fs.promises.access(mountsPath);
    return true;
  } catch {
    return false;
  }
}
