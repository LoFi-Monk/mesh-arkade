import type { MeshStore } from './types.js'

/**
 * @intent   Add a system to the managed systems list.
 * @guarantee On return, the system key is set to true in the managed systems sub-store.
 * @constraint systemName must be a canonical No-Intro/Libretro system name. Duplicate writes are idempotent.
 */
export async function addManagedSystem(
  store: MeshStore,
  systemName: string
): Promise<void> {
  await store.ready()

  const db = store.db.sub('systems').sub('managed')
  await db.put(systemName, true)
}

/**
 * @intent   List all managed systems.
 * @guarantee On return, an array of canonical system names in Hyperbee key-sort order.
 * @constraint Returns an empty array if no systems have been added. Store must be initialized before calling.
 */
export async function listManagedSystems(
  store: MeshStore
): Promise<string[]> {
  await store.ready()

  const db = store.db.sub('systems').sub('managed')
  const systems: string[] = []

  for await (const entry of db.createReadStream()) {
    systems.push(entry.key)
  }

  return systems
}
