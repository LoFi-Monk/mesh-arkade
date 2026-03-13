/**
 * @file curator.ts
 * @description Curator - manages library mounts (cellular library directories).
 */

import {
  Mount,
  MountStatus,
  loadMounts,
  saveMounts,
  MESH_HUB_DIR,
} from "./storage.js";
import { stat, access, mkdir, readdir } from "fs/promises";
import { join } from "path";

const ROM_EXTENSIONS = [
  ".zip",
  ".7z",
  ".rar",
  ".nes",
  ".snes",
  ".smc",
  ".sfc",
  ".gba",
  ".gbc",
  ".gb",
  ".n64",
  ".z64",
  ".v64",
  ".iso",
  ".bin",
  ".cue",
  ".md",
  ".gen",
  ".sms",
  ".pce",
  ".pc10",
  ".ws",
  ".wsc",
  ".nds",
  ".3ds",
  ".cia",
  ".xci",
  ".nsp",
  ".vpk",
  ".pbp",
  ".chd",
  ".rvz",
  ".wad",
  ".wbfs",
  ".gcm",
  ".gcz",
  ".narc",
  ".cci",
  ".xci",
];

async function isValidDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function meshHubExists(path: string): Promise<boolean> {
  const hubPath = join(path, MESH_HUB_DIR);
  try {
    await access(hubPath);
    return true;
  } catch {
    return false;
  }
}

async function createMeshHub(path: string): Promise<void> {
  const hubPath = join(path, MESH_HUB_DIR);
  await mkdir(hubPath, { recursive: true });
}

async function countRomFiles(path: string): Promise<number> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = entry.name.toLowerCase().slice(entry.name.lastIndexOf("."));
        if (ROM_EXTENSIONS.includes(ext)) {
          count++;
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Curator manages library mounts and directory lifecycle.
 *
 * @intent Provide a central controller for library discovery and indexing.
 * @guarantee Methods are idempotent or throw clear errors on failure.
 */
class CuratorClass {
  /**
   * Mounts a local directory as a game library.
   *
   * @intent Register a new library path and initialize its mesh-hub index.
   * @guarantee Returns a Mount object on success. Throws if path is invalid or already mounted.
   */
  async mount(path: string): Promise<Mount> {
    if (!(await isValidDirectory(path))) {
      throw new Error(`Invalid path: ${path} is not a valid directory`);
    }

    const mounts = await loadMounts();
    const existing = mounts.find((m) => m.path === path);
    if (existing) {
      if (existing.status === MountStatus.Active) {
        throw new Error(`Path ${path} is already mounted`);
      }
    }

    const hubExists = await meshHubExists(path);
    if (!hubExists) {
      await createMeshHub(path);
    }

    const fileCount = await countRomFiles(path);
    const now = new Date().toISOString();

    const newMount: Mount = {
      path,
      status: MountStatus.Active,
      fileCount,
      createdAt: now,
      lastIndexed: now,
    };

    const updatedMounts = mounts.filter((m) => m.path !== path);
    updatedMounts.push(newMount);
    await saveMounts(updatedMounts);

    return newMount;
  }

  /**
   * Unmounts a library path.
   *
   * @intent Remove a library from the system management.
   * @guarantee Removes the mount entry from persistent storage. Throws if mount not found.
   */
  async unmount(path: string): Promise<void> {
    const mounts = await loadMounts();
    const index = mounts.findIndex((m) => m.path === path);

    if (index === -1) {
      throw new Error(`Mount ${path} not found`);
    }

    mounts.splice(index, 1);
    await saveMounts(mounts);
  }

  /**
   * Lists all registered library mounts.
   *
   * @intent Provide visibility into all mounted collections.
   * @guarantee Returns an array of Mount objects from persistent storage.
   */
  async listMounts(): Promise<Mount[]> {
    return loadMounts();
  }

  /**
   * Retrieves a specific mount by path.
   *
   * @intent Fetch metadata for a single known library.
   * @guarantee Returns the Mount object if found, otherwise null.
   */
  async getMount(path: string): Promise<Mount | null> {
    const mounts = await loadMounts();
    return mounts.find((m) => m.path === path) ?? null;
  }
}

/**
 * Static instance of the Curator manager.
 *
 * @intent Provide a central entry point for library mount management.
 * @guarantee Always refers to the singleton CuratorClass instance.
 */
export const Curator = new CuratorClass();
export { Mount, MountStatus };
export default Curator;
