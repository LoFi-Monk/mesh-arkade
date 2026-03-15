## Context

Four core modules (`database.ts`, `storage.ts`, `curator.ts`, `curation.ts`) each implement their own Bare/Node conditional import pattern for `fs`, `path`, `os`, and `fetch`. Three modules (`database.ts`, `storage.ts`, `hub.ts`) duplicate identical `Pear.app.storage` resolution with `./data` fallback. DAT parsing (~95 lines) lives inline in `curation.ts`, mixing parsing concerns with orchestration. Factory export naming is inconsistent — `getCurator()` and `getCurationManager()` suggest singletons but create new instances per call, unlike the actual singleton `getEngineHub()`.

Milestone-05 will add P2P fetch logic that needs `fetch`, `fs`, and `path` across new modules. Without centralization, the duplication will compound.

## Goals / Non-Goals

**Goals:**
- Single module (`runtime.ts`) for all Bare/Node conditional imports — one place to change when adding new polyfills
- Single module (`paths.ts`) for all storage path resolution — one place to update when Pear storage semantics change
- DAT parsing isolated in `dat-parser.ts` for independent testing and reuse
- Clear factory naming: `create*` for per-call factories, `get*` for singletons
- Zero behavior changes — CLI commands produce identical output before and after

**Non-Goals:**
- Refactoring `hub.ts` singleton pattern (it's correct for app lifecycle management)
- Adding new runtime capabilities (e.g. network detection) — that's milestone-05 scope
- Changing DAT parsing logic or adding new format support
- Modifying the CLI command layer or `index.js`

## Decisions

### D1: Lazy async getters in `runtime.ts`

Export `getFs()`, `getPath()`, `getOs()`, `getFetch()` as async functions that resolve the Bare or Node module on first call and cache the result.

**Rationale:** The current codebase already uses async dynamic imports (because Bare modules require `await import()`). Lazy initialization avoids import-time side effects and keeps the module compatible with both runtimes without top-level await.

**Alternative considered:** Top-level `await` with module-scoped variables. Rejected because Bare's module system doesn't reliably support top-level await in all contexts, and lazy init is already the pattern used in `database.ts`.

### D2: `paths.ts` owns base path only, not socket paths

`paths.ts` exports `getStorageBasePath()` which resolves `Pear.app.storage` or `./data`. Hub-specific concerns like socket path derivation (`mesharkade.sock` with Windows separator detection) stay in `hub.ts` and call `getStorageBasePath()` for the base.

**Rationale:** Socket path logic is hub-specific (only the IPC server needs it). Pulling it into a shared module would leak hub concerns into a utility.

**Alternative considered:** Full path registry in `paths.ts` (storage, socket, mounts, DB). Rejected as over-abstraction for the current needs — only the base path is actually duplicated.

### D3: Extract DAT parser as pure functions

`dat-parser.ts` exports `parseDat()`, `parseClrmamepro()`, `parseDatXml()`, and `extractRegion()` as pure functions. No runtime imports needed — these operate on strings.

**Rationale:** Pure string→data functions are the easiest to test and have no runtime coupling. `curation.ts` keeps the fetch+orchestration logic and imports the parser.

### D4: Rename factories to `create*` pattern

`getCurator()` → `createCurator()`, `getCurationManager()` → `createCurationManager()`. The `get*` prefix is reserved for singletons (`getEngineHub()`).

**Rationale:** Naming communicates lifecycle. `get` implies "retrieve the one instance"; `create` signals "new instance each call." This prevents bugs where callers assume shared state.

**Alternative considered:** Make curator/curation actual singletons. Rejected — they're stateless wrappers over external storage, so per-call instantiation is correct and more testable.

### D5: `runtime.ts` caches per-module, not per-function

A single internal `ensureRuntime()` resolves all modules (`fs`, `path`, `os`) in one call. Individual getters check the cache and call `ensureRuntime()` only if cold. `getFetch()` is separate because it has unique fallback logic (globalThis.fetch → bare-fetch → node-fetch).

**Rationale:** The modules are almost always needed together (any file operation needs `fs` + `path`). Batching avoids multiple sequential dynamic imports.

## Risks / Trade-offs

- **[Risk] Circular imports** → `runtime.ts` and `paths.ts` must be leaf modules with zero internal imports. They import only from `bare-*` or Node builtins.
- **[Risk] Rename breakage** → `createCurator()`/`createCurationManager()` rename touches CLI command files. Mitigation: grep all call sites, update in same PR, tests catch any misses.
- **[Risk] Bare runtime edge cases** → Consolidating detection into one module means a bug there affects everything. Mitigation: unit tests covering both Bare and Node code paths via mocking.
- **[Trade-off] Slightly more indirection** → Consumer modules call `await getFs()` instead of inline import. Acceptable cost for DRY.
