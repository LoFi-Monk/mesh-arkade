## RENAMED Requirements

### Requirement: ProfileService interface
- **FROM:** ProfileService interface
- **TO:** IdentityService interface (defined in identity-service spec)

### Requirement: ProfileService stub
- **FROM:** ProfileService stub
- **TO:** IdentityServiceStub (defined in identity-service spec)

## MODIFIED Requirements

### Requirement: ArkiveService facade
The system SHALL provide an `ArkiveService` class that owns all catalog operations. CLI and UI SHALL interact with the catalog exclusively through ArkiveService methods — never directly accessing Hyperbee, fetch, or parse modules.

#### Scenario: ArkiveService construction
- **WHEN** `new ArkiveService({ store, identity? })` is called with a Hyperbee store and optional IdentityService
- **THEN** an ArkiveService instance is returned ready for use

#### Scenario: ArkiveService construction without identity
- **WHEN** `new ArkiveService({ store })` is called without an IdentityService
- **THEN** browse and search methods work normally
- **THEN** collection-gated methods throw `IdentityRequiredError`

### Requirement: Collection methods throw IdentityRequiredError
ArkiveService SHALL include collection method stubs (e.g., `createCollection`, `addToCollection`) that throw `IdentityRequiredError` when called without an IdentityService or when the identity indicates no active user. These methods are placeholders for CORE-009.

#### Scenario: Collection method without identity
- **WHEN** `arkive.createCollection(...)` is called with no IdentityService attached
- **THEN** an `IdentityRequiredError` is thrown

#### Scenario: Collection method with identity stub
- **WHEN** `arkive.createCollection(...)` is called with an IdentityServiceStub
- **THEN** an `IdentityRequiredError` is thrown (stub always returns no identity)

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

## REMOVED Requirements

### Requirement: ProfileRequiredError usage in ArkiveService
**Reason:** Replaced by `IdentityRequiredError` — same behavior, new name aligned with IdentityService rename.
**Migration:** All references to `ProfileRequiredError` become `IdentityRequiredError`.
