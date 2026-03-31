import type { MeshStore } from '../store/types.js'

/**
 * @intent   Represents a user's identity with keypair and trust information.
 * @guarantee Contains public key for mesh identity and trust metrics.
 */
export interface Identity {
  id: string
  publicKey: string
  ratio: number
  displayName: string
  rep: number
  trustScore: number
}

/**
 * @intent   Service interface for managing user identity.
 * @guarantee Provides methods to create, get, and check identity existence.
 */
export interface IdentityService {
  createIdentity(displayName: string): Promise<Identity>
  getIdentity(): Promise<Identity | null>
  hasIdentity(): Promise<boolean>
  createProfile(displayName: string): Promise<ChildProfile>
  getProfiles(): Promise<ChildProfile[]>
  getActiveProfile(): Promise<ChildProfile | null>
  setActiveProfile(profileId: string): Promise<void>
  getCollections(): Promise<Collection[]>
  getPlaylists(profileId: string): Promise<Playlist[]>
}

/**
 * @intent   Error thrown when an operation requires an identity but none is set.
 * @guarantee Error message indicates identity is required.
 */
export class IdentityRequiredError extends Error {
  /**
   * @intent   Construct error with default message.
   * @guarantee Error name is set to IdentityRequiredError.
   */
  constructor(message = 'Identity required for this operation') {
    super(message)
    this.name = 'IdentityRequiredError'
  }
}

export interface Collection {
  id: string
  name: string
  ownerPublicKey: string
  gameCount: number
  createdAt: number
}

export interface Playlist {
  id: string
  name: string
  profileId: string
  gameCount: number
  createdAt: number
}

export interface PlaylistEntry {
  playlistId: string
  crc: string
  addedAt: number
}

export interface ChildProfile {
  id: string
  displayName: string
  avatar: string
  settings: Record<string, unknown>
  active: boolean
  createdAt: number
}

export interface ArkiveServiceOptions {
  store: MeshStore
  identity?: IdentityService
}

export interface TitleEntry {
  name: string
  crc: string
  region?: string
  developer?: string
  genre?: string
  releaseyear?: string
  publisher?: string
}

export interface ListTitlesOptions {
  system: string
  limit?: number
  offset?: number
}

export interface SearchOptions {
  system: string
  query: string
  limit?: number
}
