## ADDED Requirements

### Requirement: Centralized storage base path
`paths.ts` SHALL export a function `getStorageBasePath()` that returns the application storage directory. It MUST check `Pear.app.storage` first and fall back to `"./data"` if Pear is not available.

#### Scenario: Running in Pear runtime
- **WHEN** `getStorageBasePath()` is called and `typeof Pear !== "undefined"` and `Pear.app.storage` is defined
- **THEN** it returns the value of `Pear.app.storage`

#### Scenario: Running outside Pear
- **WHEN** `getStorageBasePath()` is called and `typeof Pear === "undefined"`
- **THEN** it returns `"./data"`

### Requirement: Single source of truth
All modules that need the storage base path (`database.ts`, `storage.ts`, `hub.ts`) SHALL import `getStorageBasePath()` from `paths.ts` instead of implementing their own resolution.

#### Scenario: No remaining inline resolution
- **WHEN** `database.ts`, `storage.ts`, and `hub.ts` are searched for `Pear.app.storage` or `typeof Pear`
- **THEN** zero matches are found (only `paths.ts` contains this logic)

### Requirement: Hub socket path stays in hub
`hub.ts` SHALL continue to own socket path derivation (`mesharkade.sock` with platform-aware separator). It MUST call `getStorageBasePath()` from `paths.ts` for the base directory.

#### Scenario: Socket path uses centralized base
- **WHEN** `hub.ts` derives the socket path
- **THEN** it calls `getStorageBasePath()` and appends the socket filename with the appropriate separator

### Requirement: No internal imports
`paths.ts` MUST NOT import from any other `src/` module. It SHALL be a leaf module to prevent circular dependencies.

#### Scenario: Module dependency check
- **WHEN** `paths.ts` is analyzed for import statements
- **THEN** no imports reference `src/` modules
