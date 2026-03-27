## Why

E004 (DAT Ingestion) has completed fetching (S1), system name resolution (S1c), and parsing (S2). Parsed DAT data currently exists only as in-memory objects returned by `parseDat()`. There is no persistent storage — every app restart loses all DAT data and requires re-fetching.

S3 introduces Hyperbee as the local data layer, storing parsed DAT entries in a queryable, persistent, P2P-replicable B-tree. This is the foundation that ROM verification (S4) and every downstream feature depends on. Without it, the pipeline has no memory.

ADR-0011 established Hyperbee as the data layer. ADR-0012 established in-app Hyperbee as the single source of truth for DAT data. The schema has been stress-tested against all three verification scenarios (single ROM, batch import, batch swarm download) and locked.

## What Changes

- Add `hyperbee` and `corestore` as runtime dependencies
- Add hand-written TypeScript declarations for both packages (`types/hyperbee.d.ts`, `types/corestore.d.ts`)
- Create `src/store/` module with:
  - `store.ts` — Corestore/Hyperbee lifecycle management (open, close, storage path resolution)
  - `dat-store.ts` — `storeDat(systemName, datFile)`: writes parsed DAT entries into Hyperbee using the quad-hash key schema
  - `dat-lookup.ts` — `lookupRom(systemName, hash)`: looks up a ROM by any hash type with SHA1 → MD5 → CRC32 fallback
  - `systems.ts` — `addManagedSystem(systemName)`, `listManagedSystems()`: per-system atomic key management
  - `types.ts` — store-specific types (lookup results, store options)
- Normalize all incoming hashes to uppercase on both write and lookup paths
- Preserve `DatRom.serial` in stored values for future metadata use (not indexed as a key)

## Capabilities

### New Capabilities
- `dat-store`: Persistent storage of parsed DAT data in Hyperbee — write, read, prefix scan, system management, hash-based ROM lookup with fallback

### Modified Capabilities
- `dat-parse`: `DatRom` type gains `sha256?: string` field (already applied to types.ts). No behavioral change to the parser — field is populated when present in source DAT.

## Impact

- **Dependencies**: `hyperbee` and `corestore` added to `package.json`
- **Types**: New `.d.ts` files in `types/` for Hyperbee and Corestore
- **New module**: `src/store/` — new directory, no changes to existing `src/dat/` or `src/core/`
- **Storage**: Corestore persists to `Pear.config.storage` (production) or temp directory (tests)
- **Test surface**: New test file `test/store.test.ts` covering store lifecycle, DAT write/read round-trip, hash lookup with fallback, system management, prefix scans
