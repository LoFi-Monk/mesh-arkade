# Integration Test Harness — Shared Infrastructure

## 1. Problem Statement

The MeshARKade codebase needs a shared test infrastructure layer to enable reliable end-to-end integration tests for the P2P fetch system (DHT lookup + peer connect + piece download). Without a unified harness, each test would duplicate setup/teardown logic, leading to flaky tests and maintenance burden.

## 2. User Story

As a developer, I want a reliable, reusable test harness so that I can write integration tests that exercise the full P2P fetch pipeline without boilerplate duplication.

## 3. Acceptance Criteria

### Happy Path

- **GIVEN** a test file imports from `src/test-utils/harness.ts`, **WHEN** `setupTestEnv()` is called, **THEN** `Pear.app.storage` is stubbed to an OS temp directory and all modules are reset
- **GIVEN** a test has run, **WHEN** `teardownTestEnv()` is called, **THEN** the database is closed, `CoreHub` singleton is reset, and temp directories are removed
- **GIVEN** a test needs a mock peer, **WHEN** `createMockPeer(sha1, data)` is called, **THEN** a mock fetch layer is returned that serves the provided bytes when SHA1 matches

### Edge Cases

- **GIVEN** `setupTestEnv()` is called twice without teardown, **THEN** the second call resets state cleanly
- **GIVEN** temp directory creation fails, **THEN** an informative error is thrown

### Error Handling

- **GIVEN** `createMockPeer` receives an empty `data` array, **WHEN** SHA1 lookup occurs, **THEN** the mock returns empty bytes gracefully
- **GIVEN** `teardownTestEnv()` is called when nothing was setup, **THEN** it handles gracefully (no-op)

## 4. Technical Context

| Aspect             | Value                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Affected Files     | `src/__fixtures__/test.dat`, `src/test-utils/harness.ts`, `src/test-utils/__tests__/harness.test.ts` |
| Dependencies       | Vitest, `os` module via `runtime.ts`, `CoreHub`, `closeDatabase`                                     |
| Constraints        | No `any` types, TSDoc on all exports, Bare-compatible (`os.tmpdir()` via `getOs()`)                  |
| Patterns to Follow | Singleton reset pattern from `hub.test.ts`, runtime mock pattern from `curator.test.ts`              |

## 5. Non-Goals

- This harness does NOT include actual network simulation (DHT/peer mocks)
- This harness does NOT include database seeding utilities (separate concern)
- This harness does NOT replace Vitest configuration

## 6. Implementation Tasks

```tasks
## Phase 1: Test Fixtures
- [ ] T001: Write test for test.dat fixture | File: src/__fixtures__/test.dat
- [ ] T002: Create minimal CLRMamePro DAT fixture with known SHA1 | File: src/__fixtures__/test.dat

## Phase 2: Harness Implementation
- [ ] T003: Write test for setupTestEnv() | File: src/test-utils/__tests__/harness.test.ts
- [ ] T004: Implement setupTestEnv() | File: src/test-utils/harness.ts
- [ ] T005: Write test for teardownTestEnv() | File: src/test-utils/__tests__/harness.test.ts
- [ ] T006: Implement teardownTestEnv() | File: src/test-utils/harness.ts
- [ ] T007: Write test for createMockPeer() | File: src/test-utils/__tests__/harness.test.ts
- [ ] T008: Implement createMockPeer() | File: src/test-utils/harness.ts
```

## 7. Success Metrics

- All three harness utilities have corresponding unit tests
- Tests pass with `npm test -- --coverage`
- Coverage threshold maintained at 80%
- TSDoc comments on all exports with `@intent`, `@guarantee`, `@constraint`
- Zero `any` types

## 8. Risks & Mitigations

| Risk                                   | Mitigation                                           |
| -------------------------------------- | ---------------------------------------------------- |
| Bare module mocking complexity         | Follow existing `tests/setup.ts` patterns            |
| Singleton state bleeding between tests | Reset in `beforeEach` + explicit `teardownTestEnv()` |
| Temp dir cleanup on Windows            | Use `getOs().tmpdir()` and handle async properly     |
