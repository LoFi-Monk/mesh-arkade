## Why

CORE-007 shipped `ArkiveService` with a `ProfileServiceStub` — a placeholder that always returns null/false. The app currently has no real identity. Without identity, there's no keypair, no reputation, no collections, and no path to the swarm. CORE-008 replaces the stub with a real `IdentityService` backed by Corestore-managed Hypercore keypairs, defines the Identity → Child Profile → Collection/Playlist hierarchy, and cleans up dead DAT caching code (ADR-0018).

## What Changes

- **Rename** `ProfileService` → `IdentityService`, `Profile` → `Identity`, `ProfileServiceStub` → `IdentityServiceStub`, `ProfileRequiredError` → `IdentityRequiredError` throughout codebase
- **New** `IdentityService` implementation — `createIdentity()`, `getIdentity()`, `hasIdentity()` backed by Corestore keypair + Hyperbee storage
- **New** child profile CRUD — `createProfile()`, `getProfiles()`, `getActiveProfile()` stored under parent identity's Hyperbee sub-tree
- **New** `Collection` and `Playlist` type definitions (shells only — implementation is CORE-009)
- **Modified** `ArkiveService` injection — accepts `IdentityService` instead of `ProfileService`
- **Removed** `saveDatCache()` function and `DATs/` directory creation from `app-root.ts` (ADR-0018 cleanup) **BREAKING** for any code calling `saveDatCache()` or expecting `~/mesh-arkade/DATs/`
- **Removed** `saveDatCache()` call from `ArkiveService.refreshCatalog()`

## Capabilities

### New Capabilities
- `identity-service`: Corestore-backed identity management — keypair derivation, display name, settings, rep/ratio field shells. The cryptographic anchor for all user activity on the mesh.
- `child-profile`: Child profile CRUD under a parent identity — display name, avatar, gaming settings. Profiles own Playlists (CORE-009). Activity rolls up to parent identity's rep.
- `collection-playlist-types`: Type definitions for Collection (verified game library on Identity) and Playlist (curated list on child Profile). Shell interfaces only — implementation deferred to CORE-009.

### Modified Capabilities
- `arkive-service`: Injection changes from `ProfileService` to `IdentityService`. Collection guard methods updated. `refreshCatalog()` no longer calls `saveDatCache()`.
- `app-root`: Remove `saveDatCache()` export and `DATs/` directory creation from `initAppRoot()`. `config.json` creation stays.

## Impact

- **src/arkive/types.ts** — `Profile` → `Identity`, `ProfileService` → `IdentityService`, new Collection/Playlist types
- **src/arkive/profile-stub.ts** — renamed to `identity-stub.ts`, implements `IdentityService`
- **src/arkive/arkive-service.ts** — injection type change, `saveDatCache()` call removed from `refreshCatalog()`
- **src/arkive/app-root.ts** — `saveDatCache()` removed, `initAppRoot()` no longer creates `DATs/`
- **src/arkive/index.ts** — re-exports updated
- **New file** `src/arkive/identity-service.ts` — real implementation
- **New file** `src/arkive/child-profile.ts` — child profile CRUD
- **test/** — all arkive tests updated for rename + new identity/profile test suites
- **Dependencies** — no new npm deps (Corestore + Hyperbee already in stack)
