import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'

export interface CollectionInfo {
  id: string
  name: string
  path: string
  createdAt: number
}

export interface ListCollectionInfo extends CollectionInfo {
  connected: boolean
}

export type RegisterCollectionResult =
  | { ok: true; collection: CollectionInfo }
  | { ok: false; error: { type: 'path-not-found' | 'already-registered'; message: string } }

function getCollectionMarkerPath(collectionPath: string): string {
  return path.join(collectionPath, '.mesh-arkade')
}

function getCollectionJsonPath(collectionPath: string): string {
  return path.join(getCollectionMarkerPath(collectionPath), 'collection.json')
}

function isCollectionRegistered(collectionPath: string): boolean {
  const markerPath = getCollectionMarkerPath(collectionPath)
  const jsonPath = getCollectionJsonPath(collectionPath)
  return fs.existsSync(markerPath) && fs.existsSync(jsonPath)
}

/**
 * @intent   Register a new collection by creating a .mesh-arkade/ marker folder and collection.json.
 * @guarantee Returns CollectionInfo on success, error result if path doesn't exist or is already registered.
 * @constraint The collectionPath must exist on the filesystem. If .mesh-arkade/ already exists, returns error.
 */
export async function registerCollection(
  collectionPath: string,
  name: string
): Promise<RegisterCollectionResult> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(collectionPath)) {
        resolve({
          ok: false,
          error: {
            type: 'path-not-found',
            message: `Collection path does not exist: ${collectionPath}`,
          },
        })
        return
      }

      if (isCollectionRegistered(collectionPath)) {
        resolve({
          ok: false,
          error: {
            type: 'already-registered',
            message: `Collection is already registered at: ${collectionPath}`,
          },
        })
        return
      }

      const markerPath = getCollectionMarkerPath(collectionPath)
      fs.mkdirSync(markerPath, { recursive: true })

      const collectionInfo: CollectionInfo = {
        id: randomBytes(16).toString('hex'),
        name,
        path: collectionPath,
        createdAt: Date.now(),
      }

      const jsonPath = getCollectionJsonPath(collectionPath)
      fs.writeFileSync(jsonPath, JSON.stringify(collectionInfo, null, 2), 'utf-8')

      resolve({
        ok: true,
        collection: collectionInfo,
      })
    } catch (err) {
      resolve({
        ok: false,
        error: {
          type: 'path-not-found',
          message: err instanceof Error ? err.message : 'Unknown error during registration',
        },
      })
    }
  })
}

/**
 * @intent   Discover unregistered collections in a root directory by scanning for .mesh-arkade/ folders. This is a discovery tool; for the global list of registered collections (including external paths), read config.json directly.
 * @guarantee Returns array of ListCollectionInfo with connected/disconnected status based on folder presence.
 * @constraint The rootPath must exist. Searches only immediate subdirectories.
 */
export async function listCollections(rootPath: string): Promise<ListCollectionInfo[]> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(rootPath)) {
        resolve([])
        return
      }

      const entries = fs.readdirSync(rootPath, { withFileTypes: true })
      const collections: ListCollectionInfo[] = []

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue
        }

        const collectionPath = path.join(rootPath, entry.name)
        const markerPath = getCollectionMarkerPath(collectionPath)
        const jsonPath = getCollectionJsonPath(collectionPath)

        if (fs.existsSync(markerPath) && fs.existsSync(jsonPath)) {
          try {
            const content = fs.readFileSync(jsonPath, 'utf-8')
            const collectionData: CollectionInfo = JSON.parse(content)

            collections.push({
              ...collectionData,
              connected: fs.existsSync(collectionPath),
            })
          } catch {
            // Skip invalid collection.json files
          }
        }
      }

      resolve(collections)
    } catch {
      resolve([])
    }
  })
}