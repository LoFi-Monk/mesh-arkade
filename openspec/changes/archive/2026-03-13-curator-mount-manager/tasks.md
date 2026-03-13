# Tasks: Curator Library Mount Manager

> [!IMPORTANT]
> **TDD Enforcement**: Opencode MUST write/update tests in `src/core/__tests__/curator.test.ts` for each phase BEFORE implementing the corresponding logic.

## 1. Foundation & Persistence (TDD)

- [x] 1.1 Create `src/core/__tests__/curator.test.ts` with mocks for `fs` and `pear-electron` storage.
- [x] 1.2 Write failing tests for `Mount` interface and `mounts.json` persistence.
- [x] 1.3 Update `environment.ts` or create storage utility to handle `mounts.json`.
- [x] 1.4 Implement `Mount` interface and persistence logic to pass tests.

## 2. Core Curator Engine (TDD)

- [x] 2.1 Add failing tests for `Curator.mount(path)` (validating path, initializing `.mesh-hub`, creating Hypercore).
- [x] 2.2 Implement `mount(path)` logic in `src/core/curator.ts`.
- [x] 2.3 Add failing tests for `Curator.unmount(path)` and `listMounts()`.
- [x] 2.4 Implement `unmount` and `listMounts` logic.

## 3. Communication Layer (TDD)

- [x] 3.1 Write integration tests for `CoreHub` with `Curator` mocked, verifying JSON-RPC routing.
- [x] 3.2 Update `src/core/hub.ts` to register JSON-RPC methods: `curator:mount`, `curator:unmount`, `curator:list`.

## 4. CLI & UX (Manual & Integration)

- [x] 4.1 Update `index.js` `bootBare` with command handlers for `mount`, `unmount`, and `list-mounts`.
- [x] 4.2 Implement the "First Run" wizard (readline flow).
- [x] 4.3 Verify CLI behavior manually and via E2E integration tests (if applicable).
