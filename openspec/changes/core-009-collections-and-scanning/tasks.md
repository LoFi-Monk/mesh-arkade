## 1. Setup

- [x] 1.1 Ensure all latest dev dependencies are installed (e.g., `npm install`)
- [x] 1.2 Verify that `hyperdrive` and `localdrive` are present in `package.json`

## 2. Implement Collection Registry [Core]

### RED
- [x] 2.1 Create `test/collection-registry.test.ts` with failing tests for generating UUID, creating `.mesh-arkade/` folder, and saving `collection.json`.
- [x] 2.2 Add a failing test for `listCollections()` (discovery function marking connected/disconnected).
- [x] 2.3 Verify tests fail with "module not found" or "method not implemented".

### GREEN
- [x] 2.4 Create `src/core/collection-registry.ts` with minimal implementation for `registerCollection()` to make the UUID/folder generation test pass.
- [x] 2.5 Implement `listCollections()` minimally to check for the presence of the `.mesh-arkade/` folder and pass its test.
- [x] 2.6 Run tests — verify all green.

### REFACTOR
- [x] 2.7 Verify `collection-registry` uses abstractions (e.g., `fs` from Node aliased via bare compat) rather than direct dependencies.
- [x] 2.8 Add TSDoc tags (`@intent`, `@guarantee`, `@constraint`) to public exports.
- [x] 2.9 Run lint and tests — verify all green.

## 3. Implement Collection Scanner [Core]

### RED
- [x] 3.1 Create `test/collection-scanner.test.ts` with failing tests for non-blocking directory walking.
- [x] 3.2 Add a failing test for hashing files and performing O(1) lookups in the catalog.
- [x] 3.3 Add a failing test for atomically writing `manifest.json`.
- [x] 3.4 Verify tests fail appropriately.

### GREEN
- [x] 3.5 Create `src/core/collection-scanner.ts` with minimal `walkDirectory()` implementation.
- [x] 3.6 Implement `hashAndMatch()` using existing full-file hashing to pass the lookup test.
- [x] 3.7 Implement `writeManifest()` (atomic write via `.tmp`) to pass the manifest test.
- [x] 3.8 Run tests — verify all green.

### REFACTOR
- [x] 3.9 Extract shared hashing or matching logic if applicable to keep single responsibility (SOLID).
- [x] 3.10 Add TSDoc to public exports in `src/core/collection-scanner.ts`.
- [x] 3.11 Run lint and tests — verify all green.

## 4. Implement Virtual Mirror [Core]

### RED
- [x] 4.1 Create `test/virtual-mirror.test.ts` with a failing test for mounting a verified file using `Localdrive` and `Hyperdrive`.
- [x] 4.2 Add a failing test simulating a Merkle mismatch read failure (simulating file modification on disk).
- [x] 4.3 Verify tests fail as expected.

### GREEN
- [x] 4.4 Create `src/core/virtual-mirror.ts` with `mountCollection()` using Hyperdrive + Localdrive.
- [x] 4.5 Add `syncCollection()` for syncing local files into Hyperdrive Merkle tree. Also added `unmountCollection()`.
- [x] 4.6 Run tests — verify all green.

### REFACTOR
- [x] 4.7 Ensure Pear-specific modules (`Hyperdrive`, `Localdrive`) are properly isolated behind abstractions if needed.
- [x] 4.8 Add TSDoc to public exports.
- [x] 4.9 Run lint and tests — verify all green.

## 5. Update ArkiveService [Core]

### RED
- [x] 5.1 Update `test/arkive-service.test.ts` with failing tests that verify `addCollection`, `listCollections`, and `scanCollection` throw `IdentityRequiredError` when no identity is provided.
- [x] 5.2 Add failing tests that these methods successfully call the underlying Registry, Scanner, and Mirror modules when identity is provided.
- [x] 5.3 Verify tests fail.

### GREEN
- [x] 5.4 Update `src/arkive/arkive-service.ts` to implement the `addCollection`, `listCollections`, and `scanCollection` methods to pass the tests.
- [x] 5.5 Run tests — verify all green.

### REFACTOR
- [x] 5.6 Ensure `ArkiveService` acts purely as a facade routing to the underlying core modules.
- [x] 5.7 Update TSDoc on the modified methods.
- [x] 5.8 Run lint and tests — verify all green.

## 6. Update App Root [Core]

### RED
- [x] 6.1 Update `test/app-root.test.ts` with a failing test to ensure `collections: []` is included in the default `config.json` skeleton. (ALREADY DONE)
- [x] 6.2 Verify the test fails. (N/A - already passing)

### GREEN
- [x] 6.3 Modify the `config.json` generation logic in `src/arkive/app-root.ts` to include the `collections` array. (ALREADY DONE)
- [x] 6.4 Run tests — verify all green. (N/A - already passing)

### REFACTOR
- [x] 6.5 Run lint and verify TSDoc. (N/A - already passing)
- [x] 6.6 Run all project tests — verify all green. (N/A - already passing)

## 7. CLI Integration [CLI]

### RED
- [x] 7.1 Create `test/cli-collection.test.ts` with failing tests for routing `collection add`, `collection list`, and `collection scan`.
- [x] 7.2 Verify tests fail.

### GREEN
- [x] 7.3 Update CLI routing logic (e.g., `index.ts` or CLI handler) to parse these commands and route them to `ArkiveService`.
- [x] 7.4 Run tests — verify all green.

### REFACTOR
- [x] 7.5 Ensure CLI tasks route through the appropriate handler abstraction.
- [x] 7.6 Run lint and tests — verify all green.