## 1. Dependencies and Type Declarations

- [x] 1.1 Install `hyperbee` and `corestore` as runtime dependencies in package.json
- [x] 1.2 Create `types/corestore.d.ts` — declare Corestore constructor, ready(), close(), get(), session()
- [x] 1.3 Create `types/hyperbee.d.ts` — declare Hyperbee constructor, put(), get(), del(), sub(), createReadStream(), ready(), close(), HyperbeeEntry type
- [x] 1.4 Bare smoke test — write a minimal script that creates a Corestore, opens a Hyperbee, does a put/get, verify under both Node and Bare. Fail fast if incompatible. Remove script after validation.

## 2. Store Lifecycle

- [x] 2.1 Create `src/store/types.ts` — store types: MeshStore interface (db, store, ready, close), StoreDatResult, LookupRomResult (with matchedBy field), StoredRomEntry
- [x] 2.2 Create `src/store/store.ts` — `createStore(storagePath?)` function: init Corestore with path (default Pear.config.storage), create Hyperbee with keyEncoding utf-8 and valueEncoding json, return MeshStore object with ready() and close()
- [x] 2.3 Write tests for store lifecycle — create, ready, close, verify closed store rejects operations

## 3. DAT Storage (Write Path)

- [x] 3.1 Create `src/store/dat-store.ts` — `storeDat(store, systemName, datFile)` function: iterate DatFile.games and their roms, write hash keys (sha1, md5, crc, sha256 when present) with full fingerprint cross-references in values, write header key, normalize all hashes to uppercase in keys
- [x] 3.2 Preserve `DatRom.serial` in stored values alongside hash cross-references
- [x] 3.3 Write tests for storeDat — round-trip write/read with all hash types, SHA256 written only when present, CRC-only ROM writes single key, header key written correctly, serial preserved

## 4. ROM Lookup (Read Path)

- [x] 4.1 Create `src/store/dat-lookup.ts` — `lookupRom(store, systemName, hash)` function: normalize input hash to uppercase, attempt SHA1 key lookup, fall back to MD5, fall back to CRC. Return match with matchedBy indicator or null.
- [x] 4.2 Write tests for lookupRom — SHA1 hit returns matchedBy sha1, SHA1 miss falls back to MD5, all miss returns null, lowercase input normalized before lookup

## 5. System Management

- [x] 5.1 Create `src/store/systems.ts` — `addManagedSystem(store, systemName)` and `listManagedSystems(store)` using per-system atomic keys and prefix scan via db.sub('systems').sub('managed')
- [x] 5.2 Write tests for system management — add system, list returns it, add twice is idempotent, list multiple systems

## 6. Prefix Scan

- [x] 6.1 Implement prefix scan helper in `src/store/dat-store.ts` or `dat-lookup.ts` — enumerate all entries for a system using db.sub('dat').sub(systemName).createReadStream()
- [x] 6.2 Write tests for prefix scan — returns all hash entries plus header for a stored system, empty result for unstored system

## 7. Module Wiring and dat-parse Delta

- [x] 7.1 Create `src/store/index.ts` — barrel export: createStore, storeDat, lookupRom, addManagedSystem, listManagedSystems, and store types
- [x] 7.2 Update `src/dat/parser.ts` — extract sha256 field from ROM entries when present in CLRMamePro DAT content, normalize to uppercase
- [x] 7.3 Write test for sha256 parser extraction — ROM with sha256 field parses correctly, uppercase normalized

## 8. Verification and Cleanup

- [x] 8.1 Verify all hash lookups use uppercase normalization on both write and read paths (gotcha #5)
- [x] 8.2 Confirm `DatRom.serial` is stored but not indexed as a separate key (gotcha #6)
- [x] 8.3 Run full test suite under Node and Bare — all existing + new tests pass
- [x] 8.4 Run lint — zero errors
- [x] 8.5 Run coverage check — meets 80% threshold
