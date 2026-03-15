/**
 * @file database.ts
 * @description Database module for managing Hyperbee storage and namespaces.
 */

import { getFs, getPath } from "./runtime.js";
import { getStorageBasePath } from "./paths.js";
import Corestore from "corestore";
import Hyperbee from "hyperbee";

/**
 * @intent Represents a retro system entry (e.g. Nintendo NES) stored in the Hyperbee systems namespace.
 * @guarantee All fields are always present; last_updated is an ISO 8601 timestamp string.
 */
export interface SystemRecord {
  id: string;
  title: string;
  dat_url: string;
  last_updated: string;
}

/**
 * @intent Represents a single game entry in the wishlist, keyed by system and hash for deduplication.
 * @guarantee system_id, title, sha1, crc, md5, and region are always defined; empty string when absent in the source DAT.
 */
export interface WishlistRecord {
  id?: number;
  system_id: string;
  title: string;
  sha1: string;
  crc: string;
  md5: string;
  region: string;
}

let store: Corestore | null = null;
let bee: Hyperbee | null = null;
let systemsBee: Hyperbee | null = null;
let wishlistBee: Hyperbee | null = null;
let initialized = false;
let STORAGE_PATH: string = "";

async function ensureStorageDir(): Promise<void> {
  if (initialized) return;

  const fs = await getFs();
  const path = await getPath();
  const storageBase = getStorageBasePath();
  const storagePath = path.join(storageBase, "hyperbee-storage");

  if (!fs.existsSync(storageBase)) {
    fs.mkdirSync(storageBase, { recursive: true });
  }
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  STORAGE_PATH = storagePath;
  initialized = true;
}

/**
 * @intent Returns the singleton Hyperbee root instance, initializing Corestore and storage directories on first call.
 * @guarantee Always returns the same instance after first initialization; creates storage directories if absent.
 */
export async function getDatabase(): Promise<Hyperbee> {
  if (bee) {
    return bee;
  }

  await ensureStorageDir();

  store = new Corestore(STORAGE_PATH);
  const core: any = store.get({ name: "db" } as any);
  await core.ready();

  bee = new Hyperbee(core, {
    keyEncoding: "utf-8",
    valueEncoding: "json",
  });

  await bee.ready();

  systemsBee = bee.sub("systems", {
    keyEncoding: "utf-8",
    valueEncoding: "json",
  });

  wishlistBee = bee.sub("wishlist", {
    keyEncoding: "utf-8",
    valueEncoding: "json",
  });

  await systemsBee.ready();
  await wishlistBee.ready();

  return bee;
}

/**
 * @intent Retrieves a system record by ID from the Hyperbee systems namespace.
 * @guarantee Returns null when the system does not exist; never throws on a missing key.
 */
export async function getSystem(
  systemId: string,
): Promise<SystemRecord | null> {
  const db = await getDatabase();
  const systems = db.sub("systems");
  const result = await systems.get(systemId);
  return result ? (result.value as SystemRecord) : null;
}

/**
 * @intent Inserts or replaces a system record in the Hyperbee systems namespace.
 * @guarantee Idempotent — repeated calls with the same ID overwrite the previous value without error.
 */
export async function upsertSystem(system: SystemRecord): Promise<void> {
  const db = await getDatabase();
  const systems = db.sub("systems");
  await systems.put(system.id, {
    id: system.id,
    title: system.title,
    dat_url: system.dat_url,
    last_updated: system.last_updated,
  });
}

/**
 * @intent Writes a batch of wishlist records atomically, keyed by system+sha1 or system+title-slug.
 * @guarantee No-op when records array is empty; sha1-based keys take priority over title-slug fallback.
 */
export async function insertWishlistBatch(
  records: WishlistRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const db = await getDatabase();
  const wishlist = db.sub("wishlist");

  const batch = wishlist.batch();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    let key: string;
    if (record.sha1 && record.sha1.length === 40) {
      key = `${record.system_id}!${record.sha1}`;
    } else {
      const titleSlug = record.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      key = `${record.system_id}!${titleSlug}`;
    }

    await batch.put(key, {
      title: record.title,
      sha1: record.sha1 || "",
      crc: record.crc || "",
      md5: record.md5 || "",
      region: record.region || "",
      system_id: record.system_id,
    });
  }

  await batch.flush();
}

/**
 * @intent Performs a case-insensitive substring scan of the wishlist, optionally filtered by system ID.
 * @guarantee Returns at most `limit` results; order follows Hyperbee key sort order.
 */
export async function searchWishlist(
  query: string,
  systemId?: string,
  limit = 50,
): Promise<WishlistRecord[]> {
  const db = await getDatabase();
  const wishlist = db.sub("wishlist");

  const results: WishlistRecord[] = [];
  const lowerQuery = query.toLowerCase();

  for await (const entry of wishlist.createReadStream()) {
    if (!entry.value) continue;

    const record = entry.value as WishlistRecord;

    if (systemId && record.system_id !== systemId) continue;

    if (record.title && record.title.toLowerCase().includes(lowerQuery)) {
      results.push(record);
    }

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * @intent Closes all Hyperbee and Corestore connections and nulls the module-level singletons.
 * @guarantee Safe to call when already closed; a subsequent getDatabase call will reinitialize cleanly.
 */
export async function closeDatabase(): Promise<void> {
  if (bee) {
    await bee.close();
    bee = null;
    systemsBee = null;
    wishlistBee = null;
  }
  if (store) {
    await store.close();
    store = null;
  }
}

/**
 * @intent Closes the database, deletes all on-disk storage, and resets the module to uninitialized state.
 * @guarantee After reset, the next getDatabase call creates a fresh empty store.
 * @warning Destructive and irreversible — permanently erases all persisted data.
 */
export async function resetDatabase(): Promise<void> {
  const fs = await getFs();
  const path = await getPath();
  await closeDatabase();
  const storageBase = getStorageBasePath();
  const storagePath = STORAGE_PATH || path.join(storageBase, "hyperbee-storage");
  console.log(`Resetting database at ${storagePath}...`);
  if (fs.existsSync(storagePath)) {
    fs.rmSync(storagePath, { recursive: true, force: true });
    console.log("Database storage cleared.");
  }
  initialized = false;
  STORAGE_PATH = "";
}

export { STORAGE_PATH as DATABASE_PATH };
export { STORAGE_PATH };
