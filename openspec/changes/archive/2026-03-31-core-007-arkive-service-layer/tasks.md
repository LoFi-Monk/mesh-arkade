## 1. Supplementary DAT Support (S1)

- [x] 1.1 Fix `extractGame()` in `src/dat/parser.ts` to fall back to `comment` field when `name` is missing
- [x] 1.2 Add `basePath` option to `DatFetchOptions` in `src/dat/types.ts`
- [x] 1.3 Update `fetchDat()` in `src/dat/fetch.ts` to use `basePath` option in URL construction (default: `dat`)
- [x] 1.4 Write tests for supplementary DAT parsing (comment-as-name fallback, no-name-no-comment skip)
- [x] 1.5 Write tests for `fetchDat()` with `basePath` option (metadat URLs, default path unchanged)
- [x] 1.6 Run lint and verify all existing tests still pass

## 2. Merge Pipeline (S2)

- [x] 2.1 Add enrichment fields to `StoredRomEntry` in `src/store/types.ts` (developer, genre, releaseyear, releasemonth, publisher, region — all optional)
- [x] 2.2 Add name index write to `storeDat()` in `src/store/dat-store.ts` — key schema `dat:<system>:name:<normalized-name>`, value contains CRC
- [x] 2.3 Create `src/dat/merge.ts` — merge pipeline module: fetch main + 5 supplementary DATs, parse each, join by CRC, extract region from name
- [x] 2.4 Implement region parsing function with allowlist (USA, Europe, Japan, World, etc.) — returns string or null
- [x] 2.5 Write tests for merge pipeline (CRC join, missing supplementary entries, supplementary fetch failure)
- [x] 2.6 Write tests for region parsing (single region, multi-region, no region, non-region parentheticals)
- [x] 2.7 Write tests for name index (creation, prefix scan, rebuild on re-store)
- [x] 2.8 Run lint and verify all tests pass

## 3. ARKive Service Boundary (S3)

- [x] 3.1 Create `src/arkive/types.ts` — `ProfileService` interface, `ProfileRequiredError`, `ArkiveServiceOptions`
- [x] 3.2 Create `src/arkive/profile-stub.ts` — `ProfileServiceStub` implementing `ProfileService` (always returns no profile)
- [x] 3.3 Create `src/arkive/arkive-service.ts` — `ArkiveService` class with constructor accepting `{ store, profile? }`
- [x] 3.4 Implement `listTitles(system)` — prefix scan on name index, return array of title objects
- [x] 3.5 Implement `searchByName(system, query)` — case-insensitive prefix search on name index
- [x] 3.6 Implement `getTitle(system, crc)` — CRC lookup returning full enriched `StoredRomEntry` or null
- [x] 3.7 Implement `refreshCatalog(system)` — orchestrate merge pipeline, save raw DATs to App Root cache
- [x] 3.8 Add collection method stubs (`createCollection`, `addToCollection`) that throw `ProfileRequiredError`
- [x] 3.9 Create `src/arkive/index.ts` — barrel export for ArkiveService, types, ProfileServiceStub
- [x] 3.10 Write tests for ArkiveService (listTitles, searchByName, getTitle, refreshCatalog)
- [x] 3.11 Write tests for ProfileServiceStub and ProfileRequiredError on collection methods
- [x] 3.12 Run lint and verify all tests pass

## 4. App Root Bootstrap (S4)

- [x] 4.1 Create `src/arkive/app-root.ts` — `getAppRootPath()` using `os.homedir()`, `initAppRoot()` for idempotent directory creation
- [x] 4.2 Implement `config.json` skeleton creation (version, empty collections array)
- [x] 4.3 Implement `DATs/` subdirectory creation
- [x] 4.4 Wire `initAppRoot()` into `ArkiveService.refreshCatalog()` — save raw DAT content to `DATs/<system>.dat`
- [x] 4.5 Write tests for App Root creation (first run, idempotent re-run, path resolution)
- [x] 4.6 Run lint and verify all tests pass

## 5. CLI Integration (S4 continued)

- [x] 5.1 Add command routing to `index.ts` — parse `process.argv[2]` as command, dispatch to handler
- [x] 5.2 Implement `catalog` command — call `arkive.listTitles("nes")`, print to stdout
- [x] 5.3 Implement `search <query>` command — call `arkive.searchByName("nes", query)`, print results
- [x] 5.4 Implement `info <crc>` command — call `arkive.getTitle("nes", crc)`, display full metadata
- [x] 5.5 Add startup sequence: initAppRoot → createStore → construct ArkiveService → dispatch command
- [x] 5.6 Add help/usage output for no args and unknown commands
- [x] 5.7 Write tests for CLI command routing and output
- [x] 5.8 Run lint, verify all tests pass, check coverage meets 80% threshold
