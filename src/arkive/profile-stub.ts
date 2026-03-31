import type { Profile, ProfileService } from './types.js'

/**
 * @intent   Stub implementation of ProfileService that always returns no profile.
 * @guarantee getProfile() always resolves to null, hasProfile() always resolves to false.
 */
export class ProfileServiceStub implements ProfileService {
  /**
   * @intent   Returns null (no profile available in stub).
   * @guarantee Always returns null.
   */
  async getProfile(): Promise<Profile | null> {
    return null
  }

  /**
   * @intent   Returns false (no profile available in stub).
   * @guarantee Always returns false.
   */
  async hasProfile(): Promise<boolean> {
    return false
  }
}
