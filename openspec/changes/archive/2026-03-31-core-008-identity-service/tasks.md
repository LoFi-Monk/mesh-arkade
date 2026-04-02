## 1. Rename & Retype (S1)

This is a pure refactor — existing tests are updated to compile against new names, then verified green before moving on.

- [x] 1.1 Rename `Profile` → `Identity` interface in `src/arkive/types.ts`. Add `displayName`, `rep`, `trustScore` fields. Keep `id`, `publicKey`, `ratio`.
- [x] 1.2 Rename `ProfileService` → `IdentityService` interface in `src/arkive/types.ts`. Update method signatures: `getIdentity()`, `hasIdentity()`, `createIdentity(displayName)`.
- [x] 1.3 Rename `ProfileRequiredError` → `IdentityRequiredError` in `src/arkive/types.ts`. Update default message.
- [x] 1.4 Rename `ArkiveServiceOptions.profile` → `ArkiveServiceOptions.identity` (type: `IdentityService`).
- [x] 1.5 Update all test files (`test/arkive-service.test.ts`) FIRST — rename all imports, type references, and assertions to use `Identity*` names. Tests will not compile yet.
- [x] 1.6 Rename `src/arkive/profile-stub.ts` → `src/arkive/identity-stub.ts`. Update class name to `IdentityServiceStub`. Implement updated interface (`createIdentity` throws, `getIdentity` returns null, `hasIdentity` returns false).
- [x] 1.7 Update `src/arkive/arkive-service.ts` — all `profile` references → `identity`, `ProfileService` → `IdentityService`, `ProfileRequiredError` → `IdentityRequiredError`.
- [x] 1.8 Update `src/arkive/index.ts` re-exports for renamed files and types.
- [x] 1.9 Run `npm run typecheck` — all clean. Run `npm test -- --coverage` — all passing, coverage ≥ 80%. Run `npm run lint` — clean.

## 2. IdentityService Core — RED phase (S2a)

Define types and write failing tests BEFORE any implementation.

- [x] 2.1 Add `Collection`, `Playlist`, `PlaylistEntry`, `ChildProfile` type shells to `src/arkive/types.ts`.
- [x] 2.2 Add child profile and collection/playlist method signatures to `IdentityService` interface: `createProfile()`, `getProfiles()`, `getActiveProfile()`, `setActiveProfile()`, `getCollections()`, `getPlaylists()`.
- [x] 2.3 Create `test/identity-service.test.ts` with ALL identity core tests. Tests MUST cover: first creation returns Identity with correct fields, duplicate creation throws, `getIdentity()` returns Identity after creation, `getIdentity()` returns null before creation, `hasIdentity()` returns true after creation, `hasIdentity()` returns false before creation. Tests import from `src/arkive/identity-service.ts` (file does not exist yet — tests will not compile).
- [x] 2.4 Verify tests fail to compile or fail at runtime. This is the RED phase — do NOT proceed to implementation until failing tests exist.

## 3. IdentityService Core — GREEN phase (S2b)

Implement the minimum code to make the RED tests pass.

- [x] 3.1 Create `src/arkive/identity-service.ts` — constructor accepts `MeshStore`, derives identity core via `store.get({ name: 'identity' })`.
- [x] 3.2 Implement `createIdentity(displayName)` — store display name + public key in Hyperbee at `identity/` prefix. Throw if identity already exists.
- [x] 3.3 Implement `getIdentity()` — read from Hyperbee `identity/` prefix, return `Identity` or `null`.
- [x] 3.4 Implement `hasIdentity()` — check existence of `identity/publicKey` in Hyperbee.
- [x] 3.5 Stub all other interface methods (`createProfile`, `getProfiles`, `getActiveProfile`, `setActiveProfile`, `getCollections`, `getPlaylists`) with `throw new Error('Not implemented')` or empty returns as appropriate.
- [x] 3.6 Run `npm test -- --coverage` — all identity core tests pass. Run `npm run typecheck` — clean. Run `npm run lint` — clean. Coverage ≥ 80%.

## 4. Child Profile CRUD — RED phase (S3a)

Write failing tests for all child profile methods BEFORE implementing them.

- [x] 4.1 Add tests to `test/identity-service.test.ts` for child profile CRUD. Tests MUST cover: create profile succeeds, create profile without identity throws `IdentityRequiredError`, list profiles returns created profiles, list profiles returns empty array when none created, list profiles without identity throws, get active profile returns null when none set, set active profile succeeds, set active deactivates previously active, set active with invalid ID throws, get active without identity throws, `getCollections()` returns empty array, `getPlaylists(profileId)` returns empty array.
- [x] 4.2 Verify new tests fail (stubs throw or return wrong values). This is the RED phase.

## 5. Child Profile CRUD — GREEN phase (S3b)

Implement the minimum code to make the RED tests pass.

- [x] 5.1 Implement `createProfile(displayName)` — generate random ID, store in Hyperbee at `identity/profiles/<id>/`. Throw `IdentityRequiredError` if no identity.
- [x] 5.2 Implement `getProfiles()` — scan Hyperbee `identity/profiles/` prefix, return array of `ChildProfile`. Throw `IdentityRequiredError` if no identity.
- [x] 5.3 Implement `getActiveProfile()` — find profile with `active: true`, return it or `null`. Throw `IdentityRequiredError` if no identity.
- [x] 5.4 Implement `setActiveProfile(profileId)` — set target profile active, deactivate others. Throw if profile not found. Throw `IdentityRequiredError` if no identity.
- [x] 5.5 Implement `getCollections()` stub — return empty array.
- [x] 5.6 Implement `getPlaylists(profileId)` stub — return empty array.
- [x] 5.7 Update `IdentityServiceStub` in `identity-stub.ts` to stub all new methods (profile methods throw `IdentityRequiredError`, collections/playlists return empty).
- [x] 5.8 Run `npm test -- --coverage` — all tests pass. Run `npm run typecheck` — clean. Run `npm run lint` — clean. Coverage ≥ 80%.

## 6. ArkiveService Integration — RED phase (S5a)

Update tests FIRST to assert new injection and error types.

- [x] 6.1 Update `test/arkive-service.test.ts` — change all test setup to use `IdentityServiceStub`. Update collection guard assertions to expect `IdentityRequiredError` instead of `ProfileRequiredError`. Tests will fail because ArkiveService still uses old types internally.

## 7. ArkiveService Integration — GREEN phase (S5b)

Update implementation to make tests pass.

- [x] 7.1 Update `ArkiveService` constructor to accept `identity?: IdentityService` via updated `ArkiveServiceOptions`.
- [x] 7.2 Update `createCollection()` and `addToCollection()` guards — check `this.identity` + `getIdentity()` instead of profile methods. Throw `IdentityRequiredError`.
- [x] 7.3 Run `npm test -- --coverage` — all tests pass. Run `npm run typecheck` — clean. Run `npm run lint` — clean. Coverage ≥ 80%.

## 8. ADR-0018 Cleanup — RED phase (S6a)

Update tests FIRST to reflect the removal of saveDatCache and DATs/.

- [x] 8.1 Delete `saveDatCache` tests from `test/app-root.test.ts`.
- [x] 8.2 Update `initAppRoot` tests to assert that `DATs/` directory is NOT created.
- [x] 8.3 Update any `refreshCatalog` tests that assert `saveDatCache` was called — remove those assertions.
- [x] 8.4 Verify updated tests fail (initAppRoot still creates DATs/, saveDatCache still exists). This is the RED phase.

## 9. ADR-0018 Cleanup — GREEN phase (S6b)

Remove the dead code so tests pass.

- [x] 9.1 Remove `saveDatCache()` function from `src/arkive/app-root.ts`.
- [x] 9.2 Remove `saveDatCache` export from `src/arkive/index.ts`.
- [x] 9.3 Remove `saveDatCache()` call from `ArkiveService.refreshCatalog()` in `src/arkive/arkive-service.ts`.
- [x] 9.4 Remove `DATs/` directory creation from `initAppRoot()` in `src/arkive/app-root.ts`.
- [x] 9.5 Run `npm test -- --coverage` — all tests pass. Run `npm run typecheck` — clean. Run `npm run lint` — clean. Coverage ≥ 80%.

## 10. Final Verification

- [x] 10.1 Run full test suite: `npm test -- --coverage`. All tests pass. Coverage ≥ 80% on all thresholds (statements, branches, functions, lines).
- [x] 10.2 Run `npm run typecheck` — zero errors.
- [x] 10.3 Run `npm run lint` — zero warnings, zero errors.
- [x] 10.4 Verify no references to `ProfileService`, `ProfileServiceStub`, `ProfileRequiredError`, or `saveDatCache` remain in `src/` or `test/`.
