import type { Identity, IdentityService, ChildProfile, Collection, Playlist } from './types.js'
import { IdentityRequiredError } from './types.js'

/**
 * @intent   Stub implementation of IdentityService that always returns no identity.
 * @guarantee getIdentity() always resolves to null, hasIdentity() always resolves to false.
 * @constraint Replace with real IdentityService. Do not use for production identity checks.
 */
export class IdentityServiceStub implements IdentityService {
  /**
   * @intent   Create identity - stub throws.
   * @guarantee Always throws Not implemented.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createIdentity(_displayName: string): Promise<Identity> {
    throw new Error('Not implemented')
  }

  /**
   * @intent   Returns null (no identity available in stub).
   * @guarantee Always returns null.
   * @constraint Stub only — always returns null regardless of state.
   */
  async getIdentity(): Promise<Identity | null> {
    return null
  }

  /**
   * @intent   Returns false (no identity available in stub).
   * @guarantee Always returns false.
   * @constraint Stub only — always returns false regardless of state.
   */
  async hasIdentity(): Promise<boolean> {
    return false
  }

  /**
   * @intent   Create profile - stub throws IdentityRequiredError.
   * @guarantee Always throws IdentityRequiredError.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createProfile(_displayName: string): Promise<ChildProfile> {
    throw new IdentityRequiredError('Identity required for this operation')
  }

  /**
   * @intent   Get profiles - stub throws IdentityRequiredError.
   * @guarantee Always throws IdentityRequiredError.
   */
  async getProfiles(): Promise<ChildProfile[]> {
    throw new IdentityRequiredError('Identity required for this operation')
  }

  /**
   * @intent   Get active profile - stub throws IdentityRequiredError.
   * @guarantee Always throws IdentityRequiredError.
   */
  async getActiveProfile(): Promise<ChildProfile | null> {
    throw new IdentityRequiredError('Identity required for this operation')
  }

  /**
   * @intent   Set active profile - stub throws IdentityRequiredError.
   * @guarantee Always throws IdentityRequiredError.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setActiveProfile(_profileId: string): Promise<void> {
    throw new IdentityRequiredError('Identity required for this operation')
  }

  /**
   * @intent   Get collections - stub returns empty.
   * @guarantee Always returns empty array.
   */
  async getCollections(): Promise<Collection[]> {
    return []
  }

  /**
   * @intent   Get playlists - stub returns empty.
   * @guarantee Always returns empty array.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPlaylists(_profileId: string): Promise<Playlist[]> {
    return []
  }
}
