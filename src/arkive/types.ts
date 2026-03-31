import type { MeshStore } from '../store/types.js'

/**
 * @intent   Represents a user's profile with identity and ratio information.
 * @guarantee Contains public key for identity and ratio for trust scoring.
 */
export interface Profile {
  id: string
  publicKey: string
  ratio: number
}

/**
 * @intent   Service interface for managing user profile identity.
 * @guarantee Provides methods to get profile and check if profile exists.
 */
export interface ProfileService {
  getProfile(): Promise<Profile | null>
  hasProfile(): Promise<boolean>
}

/**
 * @intent   Error thrown when an operation requires a profile but none is set.
 * @guarantee Error message indicates profile is required.
 */
export class ProfileRequiredError extends Error {
  /**
   * @intent   Construct error with default message.
   * @guarantee Error name is set to ProfileRequiredError.
   */
  constructor(message = 'Profile required for this operation') {
    super(message)
    this.name = 'ProfileRequiredError'
  }
}

export interface ArkiveServiceOptions {
  store: MeshStore
  profile?: ProfileService
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
