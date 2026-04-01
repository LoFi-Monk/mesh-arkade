## MODIFIED Requirements

### Requirement: Fetch DAT file by system name
The system SHALL provide a `fetchDat` function that accepts a system name string and optional `DatFetchOptions` and returns the raw CLRMamePro DAT file content from the Libretro Database GitHub repository. The function SHALL support a `basePath` option that overrides the default `/dat` path segment in the URL, enabling fetching from subdirectories such as `/metadat/developer` or `/metadat/genre`.

#### Scenario: Successful fetch of a known system
- **WHEN** `fetchDat("Nintendo - Game Boy")` is called
- **THEN** the function returns a result with `ok: true`, `content` containing the raw DAT string, and metadata fields (`etag`, `lastModified`, `contentLength`)

#### Scenario: System name is URL-encoded in the request
- **WHEN** `fetchDat("Nintendo - Game Boy")` is called with no `basePath` option
- **THEN** the request URL is `https://raw.githubusercontent.com/libretro/libretro-database/master/dat/Nintendo%20-%20Game%20Boy.dat`

#### Scenario: Fetch with custom basePath for supplementary DATs
- **WHEN** `fetchDat("Nintendo - Nintendo Entertainment System", { basePath: "metadat/developer" })` is called
- **THEN** the request URL is `https://raw.githubusercontent.com/libretro/libretro-database/master/metadat/developer/Nintendo%20-%20Nintendo%20Entertainment%20System.dat`

#### Scenario: Default basePath is dat
- **WHEN** `fetchDat("Nintendo - Game Boy")` is called without a `basePath` option
- **THEN** the URL uses the `/dat` path segment (same as current behavior)

## ADDED Requirements

### Requirement: DatFetchOptions includes basePath
The `DatFetchOptions` type SHALL include an optional `basePath` field of type `string`. When provided, it replaces the default `dat` path segment in the fetch URL.

#### Scenario: basePath option type
- **WHEN** `DatFetchOptions` is used with `{ basePath: "metadat/genre" }`
- **THEN** the TypeScript compiler accepts the option without error
