import type { Profile, ProfileService } from './types.js'

/**
 * @intent   Stub implementation of ProfileService that always returns no profile.
 * @guarantee getProfile() always resolves to null, hasProfile() always resolves to false.
 * @constraint Replace with real ProfileService in CORE-008. Do not use for production profile checks.
 */
export class ProfileServiceStub implements ProfileService {
  /**
   * @intent   Returns null (no profile available in stub).
   * @guarantee Always returns null.
   * @constraint Stub only — always returns null regardless of state.
   */
  async getProfile(): Promise<Profile | null> {
    return null
  }

  /**
   * @intent   Returns false (no profile available in stub).
   * @guarantee Always returns false.
   * @constraint Stub only — always returns false regardless of state.
   */
  async hasProfile(): Promise<boolean> {
    return false
  }
}
