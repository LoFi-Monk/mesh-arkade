## Why

Four core modules (`database.ts`, `storage.ts`, `curator.ts`, `curation.ts`) each independently implement Bare/Node conditional import logic for `fs`, `path`, `os`, and `fetch`. Storage path resolution (`Pear.app.storage` with `./data` fallback) is copy-pasted across three files (`database.ts`, `storage.ts`, `hub.ts`). This violates DRY and means any runtime change (e.g. adding a new Bare polyfill or changing the storage fallback) requires edits in 3-4 places — a maintenance trap as the codebase grows toward milestone-05's P2P fetch layer.

## What Changes

- **New `src/core/runtime.ts`**: Lazy-initialized, cached module loader that exports `getFs()`, `getPath()`, `getOs()`, `getFetch()`. Each detects Bare vs Node once and caches the result. All consumer modules import from here instead of doing their own detection.
- **New `src/core/paths.ts`**: Single source of truth for `Pear.app.storage` resolution. Replaces the three duplicated `getStoragePath()` implementations. Hub-specific socket path derivation stays in `hub.ts` but calls `paths.ts` for the base.
- **New `src/core/dat-parser.ts`**: Extract ~95 lines of DAT parsing (`parseDat`, `parseClrmamepro`, `parseDatXml`, `extractRegion`) from `curation.ts` into a focused module. Improves testability and keeps `curation.ts` focused on orchestration.
- **Remove all inline `if (typeof Bare !== "undefined")` import blocks** from `database.ts`, `storage.ts`, `curator.ts`, `curation.ts`.
- **Standardize factory exports**: Rename `getCurator()` → `createCurator()` and `getCurationManager()` → `createCurationManager()` to clarify these are per-call factories (vs `getEngineHub()` which is a true singleton). Update all call sites.

## Capabilities

### New Capabilities
- `runtime-loader`: Unified Bare/Node module loader with lazy initialization and caching
- `storage-paths`: Centralized storage path resolution for Pear and Node environments
- `dat-parser`: Standalone DAT file parsing (CLRMamePro and XML formats)

### Modified Capabilities
_(No existing spec-level behavior changes — this is a pure internal refactor)_

## Impact

- **Code:** `database.ts`, `storage.ts`, `curator.ts`, `curation.ts`, `hub.ts` lose duplicated imports/paths. CLI command files that call `getCurator()`/`getCurationManager()` updated to new names.
- **Tests:** New unit tests for `runtime.ts`, `paths.ts`, `dat-parser.ts`. Existing tests updated for renamed factories.
- **APIs:** No public API changes. CLI commands behave identically.
- **Dependencies:** No new dependencies. Existing `bare-fs`, `bare-path`, `bare-os`, `bare-fetch` imports consolidated.
- **Risk:** Low — pure refactor with no behavior changes. Existing CLI smoke tests validate.
