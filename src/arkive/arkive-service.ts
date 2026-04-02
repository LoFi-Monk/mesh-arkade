import type { MeshStore, StoredRomEntry } from '../store/types.js'
import type {
  ArkiveServiceOptions,
  IdentityService,
  TitleEntry,
  ListTitlesOptions,
  SearchOptions,
  AddCollectionOptions,
  ScanCollectionOptions,
  ListCollectionsOptions,
} from './types.js'
import { IdentityRequiredError } from './types.js'
import { mergeDat } from '../dat/merge.js'
import { storeDat } from '../store/dat-store.js'
import { lookupRom } from '../store/dat-lookup.js'
import * as path from 'path'
import { registerCollection, listCollections as listCollectionsFromRegistry } from '../core/collection-registry.js'
import type { ListCollectionInfo } from '../core/collection-registry.js'
import { scanCollection as scanCollectionFromScanner } from '../core/collection-scanner.js'
import type { ManifestData } from '../core/collection-scanner.js'
import { addCollectionToConfig, readConfig } from './app-root.js'
import { pathExists } from '../core/runtime.js'

/**
 * @intent   Service facade for managing the game catalog.
 * @guarantee Provides methods for listing, searching, and looking up titles.
 * @constraint Requires store to be initialized; identity is optional.
 */
export class ArkiveService {
  private store: MeshStore
  private identity: IdentityService | undefined
  private customRoot: string | undefined

  /**
   * @intent   Construct ArkiveService with store and optional identity.
   * @guarantee Store is required, identity is optional.
   * @constraint Store must be created via createStore() before passing. Identity absence restricts collection methods.
   */
  constructor(options: ArkiveServiceOptions) {
    this.store = options.store
    this.identity = options.identity
    this.customRoot = options.customRoot
  }

  /**
   * @intent   List all titles for a system.
   * @guarantee Returns array of title entries with name and CRC.
   * @constraint Store must be initialized. Returns name-indexed entries only — games without CRC are excluded.
   */
  async listTitles(options: ListTitlesOptions): Promise<TitleEntry[]> {
    const { system, limit = 100, offset = 0 } = options

    await this.store.ready()
    const nameIndex = this.store.db.sub('dat').sub(system).sub('name')

    const entries: TitleEntry[] = []
    let skipped = 0

    for await (const entry of nameIndex.createReadStream()) {
      if (skipped < offset) {
        skipped++
        continue
      }

      if (entries.length >= limit) {
        break
      }

      const value = entry.value as { crc: string }
      entries.push({
        name: entry.key,
        crc: value.crc,
      })
    }

    return entries
  }

  /**
   * @intent   Search for titles by name prefix (case-insensitive).
   * @guarantee Returns matching title entries.
   * @constraint Query is normalized to lowercase before matching. Only prefix matching is supported.
   */
  async searchByName(options: SearchOptions): Promise<TitleEntry[]> {
    const { system, query, limit = 50 } = options

    await this.store.ready()
    const nameIndex = this.store.db.sub('dat').sub(system).sub('name')

    const normalizedQuery = query.toLowerCase().trim()
    const entries: TitleEntry[] = []

    for await (const entry of nameIndex.createReadStream({
      gte: normalizedQuery,
      lte: normalizedQuery + '\xff',
    })) {
      if (entries.length >= limit) {
        break
      }

      const value = entry.value as { crc: string }
      entries.push({
        name: entry.key,
        crc: value.crc,
      })
    }

    return entries
  }

  /**
   * @intent   Look up a title by CRC.
   * @guarantee Returns full stored entry or null if not found.
   * @constraint CRC should be 8-character uppercase hex. Uses lookupRom fallback chain (SHA1→MD5→CRC→SHA256).
   */
  async getTitle(system: string, crc: string): Promise<StoredRomEntry | null> {
    const result = await lookupRom(this.store, system, crc)
    return result?.entry ?? null
  }

  /**
   * @intent   Refresh catalog by fetching and merging DATs, then storing.
   * @guarantee Stores merged DAT content in Hyperbee.
   * @constraint system must be a canonical Libretro system name (e.g. 'Nintendo - Nintendo Entertainment System'). Throws on fetch or parse failure.
   */
  async refreshCatalog(system: string): Promise<void> {
    const mergeResult = await mergeDat(system)

    if (!mergeResult.ok) {
      throw new Error(`Failed to merge DATs: ${mergeResult.error.message}`)
    }

    await storeDat(this.store, system, mergeResult.mainDat)
  }

  /**
   * @intent   Create a new collection.
   * @guarantee Throws IdentityRequiredError if no identity is set.
   * @constraint Not yet implemented. Always throws. Implementation deferred to CORE-008/CORE-009.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCollection(_name: string): Promise<void> {
    if (!this.identity) {
      throw new IdentityRequiredError('Identity required to create collection')
    }

    const identity = await this.identity.getIdentity()
    if (!identity) {
      throw new IdentityRequiredError('Identity required to create collection')
    }

    // TODO: Implement collection creation
    throw new Error('Not implemented')
  }

  /**
   * @intent   Add a game to a collection.
   * @guarantee Throws IdentityRequiredError if no identity is set.
   * @constraint Not yet implemented. Always throws. Implementation deferred to CORE-008/CORE-009.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addToCollection(_collectionId: string, _crc: string): Promise<void> {
    if (!this.identity) {
      throw new IdentityRequiredError('Identity required to add to collection')
    }

    const identity = await this.identity.getIdentity()
    if (!identity) {
      throw new IdentityRequiredError('Identity required to add to collection')
    }

    // TODO: Implement adding to collection
    throw new Error('Not implemented')
  }

  /**
   * @intent   Register a new collection at the specified path.
   * @guarantee Returns collection info on success, throws IdentityRequiredError if no identity. Updates App Root config.
   * @constraint The path must exist on the filesystem. Creates .mesh-arkade/ marker folder. Adds to config.json.
   */
  async addCollection(options: AddCollectionOptions): Promise<ListCollectionInfo> {
    if (!this.identity) {
      throw new IdentityRequiredError('Identity required to add collection')
    }

    const identity = await this.identity.getIdentity()
    if (!identity) {
      throw new IdentityRequiredError('Identity required to add collection')
    }

    const absolutePath = path.resolve(options.path)
    const result = await registerCollection(absolutePath, options.name)

    if (!result.ok) {
      throw new Error(result.error.message)
    }

    addCollectionToConfig({
      uuid: result.collection.id,
      name: result.collection.name,
      path: result.collection.path,
    }, this.customRoot)

    return {
      ...result.collection,
      connected: true,
    }
  }

  /**
   * @intent   List collections from config.json or discover collections in a root path.
   * @guarantee Returns array of collection info with connected/disconnected status.
   * @constraint If rootPath is empty/omitted: reads from global config.json and checks path existence for connected status.
   *             If rootPath is provided: calls discovery tool to find .mesh-arkade folders in subdirectories.
   */
  async listCollections(options: ListCollectionsOptions): Promise<ListCollectionInfo[]> {
    const { rootPath } = options

    if (!rootPath || rootPath === '' || rootPath === undefined) {
      const customRoot = this.customRoot
      const config = readConfig(customRoot)
      if (!config || config.collections.length === 0) {
        return []
      }

      return config.collections.map((col) => ({
        id: col.uuid,
        name: col.name,
        path: col.path,
        createdAt: 0,
        connected: pathExists(col.path),
      }))
    }

    return listCollectionsFromRegistry(rootPath)
  }

  /**
   * @intent   Scan a collection directory, hash files, and verify against catalog.
   * @guarantee Returns manifest data with verification status for each file. Writes to .mesh-arkade/manifest.json.
   * @constraint Requires identity. Uses empty catalog for verification - to be enhanced with global catalog later.
   *             Looks up collection from global config.json to support external paths.
   *             Validates collectionId is a 32-character hex string.
   */
  async scanCollection(options: ScanCollectionOptions): Promise<ManifestData> {
    if (!/^[0-9a-fA-F]{32}$/.test(options.collectionId)) {
      throw new Error('Invalid collection ID: must be a 32-character hex string')
    }

    if (!this.identity) {
      throw new IdentityRequiredError('Identity required to scan collection')
    }

    const identity = await this.identity.getIdentity()
    if (!identity) {
      throw new IdentityRequiredError('Identity required to scan collection')
    }

    const config = readConfig(this.customRoot)
    if (!config) {
      throw new Error('App config not found')
    }

    const collectionIdLower = options.collectionId.toLowerCase()
    const collectionEntry = config.collections.find(
      (c) => c.uuid.toLowerCase() === collectionIdLower
    )
    if (!collectionEntry) {
      throw new Error(`Collection not found: ${options.collectionId}`)
    }

    const catalog = new Map<string, boolean>()
    const manifest = await scanCollectionFromScanner(
      collectionEntry.path,
      collectionEntry.uuid,
      catalog
    )

    return manifest
  }
}
