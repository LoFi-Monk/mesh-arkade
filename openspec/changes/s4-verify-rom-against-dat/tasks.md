## 1. Setup Dependencies

- [x] 1.1 Install `crc-32` as a dependency (`npm i crc-32`).

## 2. Implement ROM Hashing [Core]

### RED
- [x] 2.1 Create `test/rom-hasher.test.ts` with failing tests for computing CRC32 and SHA1 simultaneously.
- [x] 2.2 Verify tests use a dynamically generated mock Buffer/file, NOT a real ROM, per ADR-0015.
- [x] 2.3 Verify tests fail with expected errors (module not found).

### GREEN
- [x] 2.4 Create `src/core/rom-hasher.ts`.
- [x] 2.5 Implement `hashRom(filePath)` to stream the file using `bare-fs` and compute both hashes in a single pass using `bare-crypto` (for SHA1) and `crc-32` (for CRC32).
- [x] 2.6 Run tests — verify they pass and hashes match expectations.

### REFACTOR
- [x] 2.7 Verify single responsibility (only handles hashing, no DB lookups).
- [x] 2.8 Ensure dependencies use Bare abstractions if necessary (e.g., `src/core/runtime.ts`).
- [x] 2.9 Add TSDoc comments (Intent / Guarantees / Constraints) to `hashRom`.
- [x] 2.10 Run lint and tests — all green.

## 3. Implement ROM Verification [Core]

### RED
- [x] 3.1 Create `test/rom-verifier.test.ts` with failing tests for verification logic.
- [x] 3.2 Ensure tests mock the `dat-store` to seed known and unknown hashes.
- [x] 3.3 Ensure tests verify that a recognized hash returns `Verified` (with metadata) and an unrecognized hash returns `Unknown` (NO "bad dump" status, per ADR-0014).
- [x] 3.4 Verify tests fail with expected errors.

### GREEN
- [x] 3.5 Create `src/core/rom-verifier.ts`.
- [x] 3.6 Implement `verifyRom(filePath, systemName)` that calls `hashRom` and performs an O(1) key lookup in the Hyperbee `dat-store`.
- [x] 3.7 Run tests — verify they pass.

### REFACTOR
- [x] 3.8 Ensure `verifyRom` cleanly delegates hashing and DB lookups rather than implementing them directly.
- [x] 3.9 Verify dependencies go through proper abstractions.
- [x] 3.10 Add TSDoc comments to `verifyRom`.
- [x] 3.11 Run lint and tests — all green.

## 4. Integration Test [Core]

### RED
- [x] 4.1 Create `test/verify-rom.integration.test.ts` with a failing test orchestrating the entire flow.
- [x] 4.2 Verify the test creates a mock file, writes mock DAT entries to a temporary Hyperbee store, and verifies the file against the store.
- [x] 4.3 Verify tests fail with expected errors.

### GREEN
- [x] 4.4 Wire up any missing integration points between `rom-hasher`, `dat-store`, and `rom-verifier`.
- [x] 4.5 Run tests — verify the integration test passes.

### REFACTOR
- [x] 4.6 Clean up test fixtures and ensure temporary databases and files are properly torn down.
- [x] 4.7 Run lint and tests — all green.