import type { MeshStore } from './types.js'

/**
 * @intent   Add a system to the managed systems list.
 * @guarantee On return, the system key is set to true.
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
 * @guarantee On return, an array of canonical system names.
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
