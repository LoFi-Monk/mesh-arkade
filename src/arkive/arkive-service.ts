import type { MeshStore, StoredRomEntry } from '../store/types.js'
import type {
  ArkiveServiceOptions,
  ProfileService,
  TitleEntry,
  ListTitlesOptions,
  SearchOptions,
} from './types.js'
import { ProfileRequiredError } from './types.js'
import { mergeDat } from '../dat/merge.js'
import { storeDat } from '../store/dat-store.js'
import { getAppRootPath, saveDatCache } from './app-root.js'
import { fetchDat } from '../dat/fetch.js'
import { lookupRom } from '../store/dat-lookup.js'

/**
 * @intent   Service facade for managing the game catalog.
 * @guarantee Provides methods for listing, searching, and looking up titles.
 * @constraint Requires store to be initialized; profile is optional.
 */
export class ArkiveService {
  private store: MeshStore
  private profile: ProfileService | undefined

  /**
   * @intent   Construct ArkiveService with store and optional profile.
   * @guarantee Store is required, profile is optional.
   */
  constructor(options: ArkiveServiceOptions) {
    this.store = options.store
    this.profile = options.profile
  }

  /**
   * @intent   List all titles for a system.
   * @guarantee Returns array of title entries with name and CRC.
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
   */
  async getTitle(system: string, crc: string): Promise<StoredRomEntry | null> {
    const result = await lookupRom(this.store, system, crc)
    return result?.entry ?? null
  }

  /**
   * @intent   Refresh catalog by fetching and merging DATs, then storing.
   * @guarantee Saves raw DAT content to App Root cache directory.
   */
  async refreshCatalog(system: string): Promise<void> {
    const mergeResult = await mergeDat(system)

    if (!mergeResult.ok) {
      throw new Error(`Failed to merge DATs: ${mergeResult.error.message}`)
    }

    await storeDat(this.store, system, mergeResult.mainDat)

    // Save raw DAT to cache
    const mainDatResult = await fetchDat(system, { basePath: 'dat' })
    if (mainDatResult.ok) {
      const appRoot = getAppRootPath()
      await saveDatCache(system, mainDatResult.content, appRoot)
    }
  }

  /**
   * @intent   Create a new collection.
   * @guarantee Throws ProfileRequiredError if no profile is set.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCollection(_name: string): Promise<void> {
    if (!this.profile) {
      throw new ProfileRequiredError('Profile required to create collection')
    }

    const profile = await this.profile.getProfile()
    if (!profile) {
      throw new ProfileRequiredError('Profile required to create collection')
    }

    // TODO: Implement collection creation
    throw new Error('Not implemented')
  }

  /**
   * @intent   Add a game to a collection.
   * @guarantee Throws ProfileRequiredError if no profile is set.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addToCollection(_collectionId: string, _crc: string): Promise<void> {
    if (!this.profile) {
      throw new ProfileRequiredError('Profile required to add to collection')
    }

    const profile = await this.profile.getProfile()
    if (!profile) {
      throw new ProfileRequiredError('Profile required to add to collection')
    }

    // TODO: Implement adding to collection
    throw new Error('Not implemented')
  }
}
