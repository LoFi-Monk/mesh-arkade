/**
 * @file storage.ts
 * @description Storage utilities for Curator mounts management using pear-electron storage.
 */

import { getFs, getPath } from "./runtime.js";
import { getStorageBasePath } from "./paths.js";

let storageMutex: Promise<void> = Promise.resolve();
let currentHolder: { release: () => void } | null = null;

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
 * @intent Name of the hidden directory created inside each mounted library to store mesh metadata.
 * @guarantee Value is always ".mesh-hub" — used as the canonical marker for a sanctified library path.
 */
export const MESH_HUB_DIR = ".mesh-hub";

/**
 * @intent Filename of the JSON file that persists the list of active and inactive library mounts.
 * @guarantee Value is always "mounts.json" — written atomically within the storage base directory.
 */
export const MOUNTS_FILE = "mounts.json";

/**
 * @intent Represents a mounted ROM library directory with its current status and scan metadata.
 * @guarantee path and status are always set; fileCount reflects the last scan; timestamps are optional.
 */
export interface Mount {
  path: string;
  status: MountStatus;
  fileCount: number;
  createdAt?: string;
  lastIndexed?: string;
}

export enum MountStatus {
  Active = "active",
  Inactive = "inactive",
  Error = "error",
}

/**
 * @intent Ensures the Pear/local storage base directory exists, creating it if absent.
 * @guarantee Returns the resolved storage path; idempotent — safe to call multiple times.
 */
export async function ensureStorageDir(): Promise<string> {
  const storagePath = getStorageBasePath();
  const fs = await getFs();

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  return storagePath;
}

/**
 * @intent Resolves the absolute path to mounts.json within the storage directory.
 * @guarantee Creates the storage directory if absent before returning the path.
 */
export async function getMountsFilePath(): Promise<string> {
  const storagePath = await ensureStorageDir();
  const path = await getPath();
  return path.join(storagePath, MOUNTS_FILE);
}

/**
 * @intent Reads and deserializes the mounts list from disk under the storage mutex.
 * @guarantee Returns an empty array on a missing file or corrupt JSON; never throws.
 */
export async function loadMounts(): Promise<Mount[]> {
  return withMutex(async () => {
    try {
      const fs = await getFs();
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
 * @intent Atomically persists the mounts list to disk via a temp-file rename, under the storage mutex.
 * @guarantee Write is atomic — a failed write does not corrupt the existing mounts.json.
 */
export async function saveMounts(mounts: Mount[]): Promise<void> {
  return withMutex(async () => {
    const fs = await getFs();
    const path = await getPath();
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
 * @intent Checks whether the mounts.json file exists in storage without reading its contents.
 * @guarantee Returns false on any filesystem error; never throws.
 */
export async function mountsFileExists(): Promise<boolean> {
  try {
    const fs = await getFs();
    const mountsPath = await getMountsFilePath();
    await fs.promises.access(mountsPath);
    return true;
  } catch {
    return false;
  }
}
