/**
 * @file curator.ts
 * @description Curator - manages library mounts (cellular library directories).
 */

import {
  type Mount,
  MountStatus,
  loadMounts,
  saveMounts,
  MESH_HUB_DIR,
  withMutex,
} from "./storage.js";
import { getFs, getPath } from "./runtime.js";

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
];

async function isValidDirectory(pathStr: string): Promise<boolean> {
  const fs = await getFs();
  try {
    const stats = await fs.promises.stat(pathStr);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function meshHubExists(pathStr: string): Promise<boolean> {
  const fs = await getFs();
  const path = await getPath();
  const hubPath = path.join(pathStr, MESH_HUB_DIR);
  try {
    await fs.promises.access(hubPath);
    return true;
  } catch {
    return false;
  }
}

async function createMeshHub(pathStr: string): Promise<void> {
  const fs = await getFs();
  const path = await getPath();
  const hubPath = path.join(pathStr, MESH_HUB_DIR);
  await fs.promises.mkdir(hubPath, { recursive: true });
}

async function countRomFiles(pathStr: string): Promise<number> {
  const fs = await getFs();
  const path = await getPath();
  try {
    let count = 0;
    async function scanDirectory(dirPath: string) {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ROM_EXTENSIONS.includes(ext)) {
            count++;
          }
        } else if (entry.isDirectory()) {
          if (entry.name !== MESH_HUB_DIR) {
            await scanDirectory(fullPath);
          }
        }
      }
    }
    await scanDirectory(pathStr);
    return count;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Curator] Error scanning ${pathStr}: ${message}`);
    return 0;
  }
}

class CuratorClass {
  async mount(path: string): Promise<Mount> {
    return withMutex(async () => {
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
    });
  }

  async unmount(path: string): Promise<void> {
    return withMutex(async () => {
      const mounts = await loadMounts();
      const index = mounts.findIndex((m) => m.path === path);

      if (index === -1) {
        throw new Error(`Mount ${path} not found`);
      }

      mounts.splice(index, 1);
      await saveMounts(mounts);
    });
  }

  async listMounts(): Promise<Mount[]> {
    return loadMounts();
  }

  async getMount(path: string): Promise<Mount | null> {
    const mounts = await loadMounts();
    return mounts.find((m) => m.path === path) ?? null;
  }
}

/**
 * @intent Factory that creates a new Curator instance for managing ROM library mounts.
 * @guarantee Returns a fully-operational CuratorClass with mount, unmount, listMounts, and getMount capabilities.
 */
export function createCurator() {
  return new CuratorClass();
}
export { Mount, MountStatus };
export default createCurator;
