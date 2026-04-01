## ADDED Requirements

### Requirement: ArkiveService facade
The system SHALL provide an `ArkiveService` class that owns all catalog operations. CLI and UI SHALL interact with the catalog exclusively through ArkiveService methods — never directly accessing Hyperbee, fetch, or parse modules.

#### Scenario: ArkiveService construction
- **WHEN** `new ArkiveService({ store, identity? })` is called with a Hyperbee store and optional IdentityService
- **THEN** an ArkiveService instance is returned ready for use

#### Scenario: ArkiveService construction without identity
- **WHEN** `new ArkiveService({ store })` is called without an IdentityService
- **THEN** browse and search methods work normally
- **THEN** collection-gated methods throw `IdentityRequiredError`

### Requirement: List titles
The system SHALL provide a `listTitles(system: string)` method that returns all game titles for a given system from the Hyperbee catalog.

#### Scenario: List all NES titles
- **WHEN** `arkive.listTitles("nes")` is called after catalog refresh
- **THEN** an array of game title objects is returned, each containing at minimum `name` and `crc`

#### Scenario: List titles for empty catalog
- **WHEN** `arkive.listTitles("nes")` is called before any catalog refresh
- **THEN** an empty array is returned

### Requirement: Search by name
The system SHALL provide a `searchByName(system: string, query: string)` method that searches the name index for games matching the query prefix.

#### Scenario: Search with matching prefix
- **WHEN** `arkive.searchByName("nes", "super mario")` is called
- **THEN** all games whose normalized names start with "super mario" are returned

#### Scenario: Search with no matches
- **WHEN** `arkive.searchByName("nes", "zzz nonexistent")` is called
- **THEN** an empty array is returned

#### Scenario: Search is case-insensitive
- **WHEN** `arkive.searchByName("nes", "SUPER MARIO")` is called
- **THEN** the same results are returned as for "super mario"

### Requirement: Get title details
The system SHALL provide a `getTitle(system: string, crc: string)` method that returns the full enriched entry for a specific game by CRC.

#### Scenario: Get existing title
- **WHEN** `arkive.getTitle("nes", "3A3B5B05")` is called for a stored game
- **THEN** the full `StoredRomEntry` is returned with all available enrichment fields

#### Scenario: Get non-existent title
- **WHEN** `arkive.getTitle("nes", "FFFFFFFF")` is called for a CRC not in the catalog
- **THEN** `null` is returned

### Requirement: Refresh catalog
The system SHALL provide a `refreshCatalog(system: string)` method that runs the full merge pipeline: fetch main + supplementary DATs, parse, merge by CRC, extract regions, store enriched entries, and rebuild the name index. The method SHALL NOT call `saveDatCache()` or write raw DAT files to disk.

#### Scenario: First catalog refresh
- **WHEN** `arkive.refreshCatalog("nes")` is called on an empty store
- **THEN** the NES catalog is populated with all entries from the merged DATs
- **THEN** the name index is built
- **THEN** no raw DAT file is written to `~/mesh-arkade/DATs/`

#### Scenario: Subsequent catalog refresh
- **WHEN** `arkive.refreshCatalog("nes")` is called on a store with existing NES data
- **THEN** the catalog is updated with fresh data from upstream

### Requirement: Collection methods throw IdentityRequiredError
ArkiveService SHALL include collection method stubs (e.g., `createCollection`, `addToCollection`) that throw `IdentityRequiredError` when called without an IdentityService or when the identity indicates no active user. These methods are placeholders for CORE-009.

#### Scenario: Collection method without identity
- **WHEN** `arkive.createCollection(...)` is called with no IdentityService attached
- **THEN** an `IdentityRequiredError` is thrown

#### Scenario: Collection method with identity stub
- **WHEN** `arkive.createCollection(...)` is called with an IdentityServiceStub
- **THEN** an `IdentityRequiredError` is thrown (stub always returns no identity)
