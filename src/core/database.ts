/**
 * @file database.ts
 * @description Database module for managing Hyperbee storage and namespaces.
 */

let fs: any;
let path: any;
let os: any;
let STORAGE_BASE: string = "./data";
let STORAGE_PATH: string = "./data/hyperbee-storage";

async function ensureEnv() {
  if (fs && path && os) return;
  if (typeof Bare !== "undefined") {
    fs = (await import("bare-fs")).default;
    path = (await import("bare-path")).default;
    os = (await import("bare-os")).default;
  } else {
    fs = await import("fs");
    path = await import("path");
    os = await import("os");
  }

  STORAGE_BASE = (() => {
    const pearApp = typeof Pear !== "undefined" ? (Pear.app as any) : null;
    if (pearApp?.storage) {
      return pearApp.storage;
    }
    return "./data";
  })();

  STORAGE_PATH = path.join(STORAGE_BASE, "hyperbee-storage");
}

import Corestore from "corestore";
import Hyperbee from "hyperbee";

/**
 * Represents a game system stored in the database.
 *
 * @intent Provide a data structure for persisted system metadata.
 * @guarantee Contains all fields required for system identification.
 */
export interface SystemRecord {
  id: string;
  title: string;
  dat_url: string;
  last_updated: string;
}

/**
 * Represents a wishlist entry for a ROM game.
 *
 * @intent Provide a data structure for persisted game metadata.
 * @guarantee Contains all fields required for game identification and verification.
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

type HyperbeeDB = InstanceType<typeof Hyperbee>;

let store: Corestore | null = null;
let bee: Hyperbee | null = null;
let systemsBee: Hyperbee | null = null;
let wishlistBee: Hyperbee | null = null;

async function ensureStorageDir(): Promise<void> {
  await ensureEnv();
  if (!fs.existsSync(STORAGE_BASE)) {
    fs.mkdirSync(STORAGE_BASE, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }
}

/**
 * Returns the Hyperbee database instance, initializing on first call.
 *
 * @intent Provide access to the Hyperbee database.
 * @guarantee Returns an initialized database ready for operations.
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
 * Retrieves a system record by ID.
 *
 * @intent Fetch a specific system from the database.
 * @guarantee Returns null if the system does not exist.
 *
 * @param systemId - The system identifier.
 * @returns The SystemRecord if found, null otherwise.
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
 * Inserts or updates a system record.
 *
 * @intent Persist system metadata to the database.
 * @guarantee The system record will be available for future queries.
 *
 * @param system - The system record to upsert.
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
 * Inserts multiple wishlist records in a batch.
 *
 * @intent Efficiently persist multiple game records.
 * @guarantee All records are written atomically.
 *
 * @param records - Array of WishlistRecord to insert.
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
      key = `game:${record.sha1}:${record.system_id}`;
    } else if (record.crc && record.crc.length === 8) {
      key = `game:${record.crc}:${record.system_id}`;
    } else if (record.md5 && record.md5.length === 32) {
      key = `game:${record.md5}:${record.system_id}`;
    } else {
      // Fallback: use name + index to ensure uniqueness
      // Create a simple hash from the name to keep key length reasonable
      const nameHash = record.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 16);
      key = `game:${nameHash}:${record.system_id}:${i}`;
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
 * Searches the wishlist for games matching a query.
 *
 * @intent Find games by title in the wishlist database.
 * @guarantee Returns up to `limit` matching records.
 *
 * @param query - The search string to match against game titles.
 * @param systemId - Optional system ID to filter results.
 * @param limit - Maximum number of results to return.
 * @returns Array of matching WishlistRecord objects.
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

  let count = 0;
  for await (const entry of wishlist.createReadStream()) {
    count++;
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
 * Closes the database connection and releases resources.
 *
 * @intent Clean up database connections on shutdown.
 * @guarantee No further database operations will succeed until reinitialized.
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
 * Resets the database by closing connections and deleting storage files.
 *
 * @intent Wipe all persisted data for a fresh start.
 * @guarantee Database storage directory is deleted and recreated on next use.
 */
export async function resetDatabase(): Promise<void> {
  await ensureEnv();
  await closeDatabase();
  console.log(`Resetting database at ${STORAGE_PATH}...`);
  if (fs.existsSync(STORAGE_PATH)) {
    fs.rmSync(STORAGE_PATH, { recursive: true, force: true });
    console.log("Database storage cleared.");
  }
}

export { STORAGE_BASE, STORAGE_PATH, STORAGE_PATH as DATABASE_PATH };
