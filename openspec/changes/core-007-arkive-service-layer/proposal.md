## Why

Mesh-ARKade's CORE-003 modules (parser, fetch, store, verifier) work but are exposed as raw building blocks — CLI and future UI would need to know about Hyperbee keys, DAT formats, and storage internals. The ARKive Service Layer wraps these into a clean API that owns the NES game catalog, metadata enrichment, and verification state. This is the foundation every downstream feature depends on (collections, scanning, media, swarm).

Additionally, the parser silently drops supplementary DATs (developer, genre, year, publisher) because `extractGame()` requires a `name` field that these DATs don't have — they use `comment` instead. And `fetchDat()` is hardcoded to the `/dat` path, unable to reach libretro's `/metadat` subdirectories.

## What Changes

- **Parser fix**: `extractGame()` falls back to `comment` when `name` is missing, enabling supplementary DAT parsing
- **Fetch expansion**: `DatFetchOptions` gains a `basePath` parameter so `fetchDat()` can target `/metadat/developer`, `/metadat/genre`, etc.
- **StoredRomEntry enrichment**: New optional fields (`developer`, `genre`, `releaseyear`, `releasemonth`, `publisher`, `region`) on the stored entry type
- **Merge pipeline**: Fetch 6 NES DATs (1 main + 5 supplementary), merge by CRC into enriched Hyperbee entries
- **Name index**: New Hyperbee sub-index mapping normalized game names to CRC for search/browse
- **Region parsing**: Extract region from game name string via allowlist (NES DATs have no explicit region field)
- **ArkiveService facade**: Service class wrapping all catalog operations — `listTitles()`, `searchByName()`, `getTitle()`, `refreshCatalog()`
- **ProfileService stub**: Typed interface + stub class injected into ArkiveService. Collection methods throw `ProfileRequiredError` until CORE-008.
- **App Root bootstrap**: `~/mesh-arkade/` directory with `config.json` and `DATs/` cache, created on first run
- **CLI integration**: Wire ArkiveService into entry point with raw `process.argv` command routing (`catalog`, `search`, `info`)

## Capabilities

### New Capabilities
- `dat-merge`: Merge pipeline — fetch multiple DATs per system, merge by CRC, enrich stored entries with supplementary metadata
- `arkive-service`: ArkiveService facade wrapping catalog operations behind a clean API boundary
- `app-root`: App Root bootstrap — `~/mesh-arkade/` directory structure, config, DAT cache
- `cli-routing`: CLI command routing via raw `process.argv` parsing

### Modified Capabilities
- `dat-parse`: `extractGame()` must fall back to `comment` field when `name` is missing (supplementary DAT support)
- `dat-fetch`: `DatFetchOptions` gains `basePath` parameter for targeting `/metadat/` subdirectories
- `dat-store`: `StoredRomEntry` extended with enrichment fields; new name-based sub-index in Hyperbee

## Impact

- **`src/dat/parser.ts`**: One-line fix in `extractGame()` — additive, no breaking change
- **`src/dat/fetch.ts`**: `basePath` parameter added to URL construction — backwards compatible (defaults to `/dat`)
- **`src/dat/types.ts`**: `DatFetchOptions` extended, `DatGame` may gain optional fields
- **`src/store/types.ts`**: `StoredRomEntry` extended with optional enrichment fields
- **`src/store/dat-store.ts`**: New name index alongside existing hash indexes
- **`src/arkive/`**: NEW directory — `ArkiveService`, `ProfileService` stub, types, App Root module
- **`index.ts`**: CLI routing added to existing 17-line entry point
- **Dependencies**: `bare-node-os` (already aliased in `package.json` for `os.homedir()`)
