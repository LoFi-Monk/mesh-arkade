## 1. Runtime Loader (`src/core/runtime.ts`)

- [x] 1.1 Create `src/core/runtime.ts` with `getFs()`, `getPath()`, `getOs()` — lazy async getters with Bare/Node detection and caching
- [x] 1.2 Add `getFetch()` with fallback chain: bare-fetch → globalThis.fetch → node-fetch
- [x] 1.3 Write unit tests for `runtime.ts` — mock both Bare and Node code paths

## 2. Storage Paths (`src/core/paths.ts`)

- [x] 2.1 Create `src/core/paths.ts` with `getStorageBasePath()` — Pear.app.storage with ./data fallback
- [x] 2.2 Write unit tests for `paths.ts` — Pear and non-Pear scenarios

## 3. DAT Parser Extraction (`src/core/dat-parser.ts`)

- [x] 3.1 Extract `parseDat()`, `parseClrmamepro()`, `parseDatXml()`, `extractRegion()` from `curation.ts` into `src/core/dat-parser.ts`
- [x] 3.2 Update `curation.ts` to import parser functions from `dat-parser.ts`
- [x] 3.3 Write unit tests for `dat-parser.ts` — CLRMamePro format, XML format, region extraction, missing fields

## 4. Migrate Consumer Modules

- [x] 4.1 Refactor `database.ts` — replace inline Bare/Node imports and storage path resolution with `runtime.ts` and `paths.ts`
- [x] 4.2 Refactor `storage.ts` — replace inline Bare/Node imports and `getStoragePath()` with `runtime.ts` and `paths.ts`
- [x] 4.3 Refactor `curator.ts` — replace inline Bare/Node imports with `runtime.ts`
- [x] 4.4 Refactor `curation.ts` — replace inline fetch detection with `runtime.ts` `getFetch()`
- [x] 4.5 Refactor `hub.ts` — replace inline `getStorageLocation()` body with `paths.ts` `getStorageBasePath()`, keep socket path derivation local

## 5. Standardize Factory Naming

- [x] 5.1 Rename `getCurator()` → `createCurator()` in `curator.ts` and update all call sites
- [x] 5.2 Rename `getCurationManager()` → `createCurationManager()` in `curation.ts` and update all call sites

## 6. Verification

- [x] 6.1 Grep codebase for remaining `typeof Bare` outside `runtime.ts` — confirm zero matches in consumer modules
- [x] 6.2 Grep codebase for remaining `Pear.app.storage` or `typeof Pear` outside `paths.ts` — confirm zero matches
- [x] 6.3 Run full test suite and CLI smoke test (`node index.js systems`, `node index.js search mario`)
