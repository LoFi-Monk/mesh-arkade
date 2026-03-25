import Corestore from 'corestore'
import { default as Hyperbee } from 'hyperbee'
import type { MeshStore } from './types.js'

declare const Pear: { config: { storage: string } } | undefined

/**
 * @intent   Create a new MeshStore instance with Corestore and Hyperbee.
 * @guarantee On return, a store object with ready() and close() lifecycle methods.
 * @constraint In Pear runtime, defaults to Pear.config.storage. In other environments, requires explicit path.
 */
export function createStore(storagePath?: string): MeshStore {
  const path = storagePath ?? (typeof Pear !== 'undefined' ? Pear.config.storage : null)

  if (!path) {
    throw new Error('Storage path is required. Provide it explicitly or run in Pear runtime.')
  }

  const store = new Corestore(path)

  const meshStore: MeshStore = {
    store,
    db: new Hyperbee(store.get({ name: 'mesh-arkade-db' }), {
      keyEncoding: 'utf-8',
      valueEncoding: 'json',
    }),

    ready() {
      return this.db.ready()
    },

    close() {
      return this.store.close()
    },
  }

  return meshStore
}
