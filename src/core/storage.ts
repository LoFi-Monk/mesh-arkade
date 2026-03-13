/**
 * @file storage.ts
 * @description Storage utilities for Curator mounts management using pear-electron storage.
 */

import { readFile, writeFile, mkdir, access } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export const MESH_HUB_DIR = ".mesh-hub";
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

export async function ensureStorageDir(): Promise<string> {
  const storagePath = getStoragePath();

  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true });
  }

  return storagePath;
}

export async function getMountsFilePath(): Promise<string> {
  const storagePath = await ensureStorageDir();
  return join(storagePath, MOUNTS_FILE);
}

export async function loadMounts(): Promise<Mount[]> {
  try {
    const mountsPath = await getMountsFilePath();
    const data = await readFile(mountsPath, "utf-8");
    return JSON.parse(data) as Mount[];
  } catch (error) {
    return [];
  }
}

export async function saveMounts(mounts: Mount[]): Promise<void> {
  const mountsPath = await getMountsFilePath();
  const dir = dirname(mountsPath);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(mountsPath, JSON.stringify(mounts, null, 2), "utf-8");
}

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

export async function mountsFileExists(): Promise<boolean> {
  try {
    const mountsPath = await getMountsFilePath();
    await access(mountsPath);
    return true;
  } catch {
    return false;
  }
}
