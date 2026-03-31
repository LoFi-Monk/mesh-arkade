import { randomBytes } from 'crypto'
import type { MeshStore } from '../store/types.js'
import type {
  Identity,
  ChildProfile,
  Collection,
  Playlist,
} from './types.js'
import { IdentityRequiredError } from './types.js'
import type { IdentityService as IIdentityService } from './types.js'

/**
 * @intent   Service for managing user identity, child profiles, and collections/playlists.
 * @guarantee Provides methods to create/retrieve identity, manage child profiles, and stub collection/playlist methods.
 * @constraint Requires MeshStore to be initialized. Throws IdentityRequiredError when identity operations require existing identity.
 */
export class IdentityService implements IIdentityService {
  private store: MeshStore

  /**
   * @intent   Construct IdentityService with a MeshStore.
   * @guarantee Store is stored for later operations.
   * @constraint Store must be created via createStore().
   */
  constructor(store: MeshStore) {
    this.store = store
  }

  private get identityDb() {
    return this.store.db.sub('identity')
  }

  private get profilesDb() {
    return this.store.db.sub('identity').sub('profiles')
  }

  private async readProfile(profileId: string): Promise<ChildProfile> {
    const profileDb = this.profilesDb.sub(profileId)

    const profileData = {
      displayName: (await profileDb.get('displayName'))?.value as string,
      id: (await profileDb.get('id'))?.value as string,
      avatar: (await profileDb.get('avatar'))?.value as string,
      settings: (await profileDb.get('settings'))?.value as Record<string, unknown>,
      active: (await profileDb.get('active'))?.value as boolean,
      createdAt: (await profileDb.get('createdAt'))?.value as number,
    }

    return {
      id: profileData.id,
      displayName: profileData.displayName,
      avatar: profileData.avatar || '',
      settings: profileData.settings,
      active: profileData.active,
      createdAt: profileData.createdAt,
    }
  }

  /**
   * @intent   Create a new identity for the user.
   * @guarantee Returns Identity with displayName, publicKey, and initial trust metrics. Throws if identity already exists.
   * @constraint displayName is required. Identity is derived from Corestore keypair.
   */
  async createIdentity(displayName: string): Promise<Identity> {
    await this.store.ready()

    const existing = await this.getIdentity()
    if (existing) {
      throw new Error('Identity already exists')
    }

    // Corestore.get() returns a Hypercore instance; no typings available in the Bare ecosystem yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const identityCore: any = this.store.store.get({ name: 'identity' })
    await identityCore.ready()

    const publicKey = identityCore.key.toString('hex')

    const identity: Identity = {
      id: publicKey.slice(0, 16),
      publicKey,
      ratio: 0,
      displayName,
      rep: 0,
      trustScore: 0,
    }

    await this.identityDb.put('displayName', displayName)
    await this.identityDb.put('publicKey', publicKey)
    await this.identityDb.put('id', identity.id)
    await this.identityDb.put('ratio', 0)
    await this.identityDb.put('rep', 0)
    await this.identityDb.put('trustScore', 0)

    return identity
  }

  /**
   * @intent   Retrieve the current user's identity.
   * @guarantee Returns Identity with all fields if exists, or null if no identity has been created.
   * @constraint Store must be initialized.
   */
  async getIdentity(): Promise<Identity | null> {
    await this.store.ready()

    const publicKeyEntry = await this.identityDb.get('publicKey')

    if (!publicKeyEntry) {
      return null
    }

    const publicKey = publicKeyEntry.value as string
    const displayName = ((await this.identityDb.get('displayName'))?.value ?? '') as string
    const id = ((await this.identityDb.get('id'))?.value ?? '') as string
    const ratio = ((await this.identityDb.get('ratio'))?.value ?? 0) as number
    const rep = ((await this.identityDb.get('rep'))?.value ?? 0) as number
    const trustScore = ((await this.identityDb.get('trustScore'))?.value ?? 0) as number

    return {
      id,
      publicKey,
      ratio,
      displayName,
      rep,
      trustScore,
    }
  }

  /**
   * @intent   Check if an identity exists.
   * @guarantee Returns true if identity has been created, false otherwise.
   * @constraint Store must be initialized.
   */
  async hasIdentity(): Promise<boolean> {
    await this.store.ready()

    const publicKeyEntry = await this.identityDb.get('publicKey')

    return publicKeyEntry !== null
  }

  private async requireIdentity(): Promise<Identity> {
    const identity = await this.getIdentity()
    if (!identity) {
      throw new IdentityRequiredError('Identity required for this operation')
    }
    return identity
  }

  /**
   * @intent   Create a child profile under the user's identity.
   * @guarantee Returns ChildProfile with generated ID. Throws IdentityRequiredError if no identity exists.
   * @constraint displayName is required.
   */
  async createProfile(displayName: string): Promise<ChildProfile> {
    await this.requireIdentity()

    const id = randomBytes(16).toString('hex')
    const now = Date.now()

    const profileDb = this.profilesDb.sub(id)
    await profileDb.put('displayName', displayName)
    await profileDb.put('id', id)
    await profileDb.put('avatar', '')
    await profileDb.put('settings', {})
    await profileDb.put('active', false)
    await profileDb.put('createdAt', now)

    const indexEntry = await this.profilesDb.get('index')
    const index: string[] = indexEntry ? (indexEntry.value as string[]) : []
    index.push(id)
    await this.profilesDb.put('index', index)

    return {
      id,
      displayName,
      avatar: '',
      settings: {},
      active: false,
      createdAt: now,
    }
  }

  /**
   * @intent   List all child profiles under the user's identity.
   * @guarantee Returns array of ChildProfile. Throws IdentityRequiredError if no identity exists.
   * @constraint Store must be initialized.
   */
  async getProfiles(): Promise<ChildProfile[]> {
    await this.requireIdentity()

    const profiles: ChildProfile[] = []
    const indexEntry = await this.profilesDb.get('index')
    const index: string[] = indexEntry ? (indexEntry.value as string[]) : []

    for (const profileId of index) {
      const profile = await this.readProfile(profileId)
      profiles.push(profile)
    }

    return profiles
  }

  /**
   * @intent   Get the currently active child profile.
   * @guarantee Returns ChildProfile if one is active, or null if none set. Throws IdentityRequiredError if no identity exists.
   * @constraint Store must be initialized.
   */
  async getActiveProfile(): Promise<ChildProfile | null> {
    await this.requireIdentity()

    const profiles = await this.getProfiles()
    return profiles.find((p) => p.active) ?? null
  }

  /**
   * @intent   Set a child profile as the active one.
   * @guarantee Sets target profile as active, deactivates others. Throws if profile not found or no identity.
   * @constraint profileId must be a valid profile ID.
   */
  async setActiveProfile(profileId: string): Promise<void> {
    await this.requireIdentity()

    const indexEntry = await this.profilesDb.get('index')
    const index: string[] = indexEntry ? (indexEntry.value as string[]) : []

    if (!index.includes(profileId)) {
      throw new Error('Profile not found')
    }

    for (const currentId of index) {
      const profileDb = this.profilesDb.sub(currentId)

      if (currentId === profileId) {
        await profileDb.put('active', true)
      } else {
        await profileDb.put('active', false)
      }
    }
  }

  /**
   * @intent   Get all collections for the identity.
   * @guarantee Returns empty array (stub - collections not yet implemented).
   * @constraint Stub only - not implemented yet.
   */
  async getCollections(): Promise<Collection[]> {
    return []
  }

  /**
   * @intent   Get all playlists for a child profile.
   * @guarantee Returns empty array (stub - playlists not yet implemented).
   * @constraint Stub only - not implemented yet.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPlaylists(_profileId: string): Promise<Playlist[]> {
    return []
  }
}
