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

### Requirement: Return HTTP metadata alongside content
The successful result SHALL include `etag` (string or null), `lastModified` (string or null), and `contentLength` (number or null) extracted from the HTTP response headers.

#### Scenario: Response includes ETag and Last-Modified headers
- **WHEN** the HTTP response contains `ETag` and `Last-Modified` headers
- **THEN** the result's `etag` and `lastModified` fields contain those header values

#### Scenario: Response is missing optional headers
- **WHEN** the HTTP response does not contain `ETag` or `Last-Modified` headers
- **THEN** the result's `etag` and `lastModified` fields are `null`

### Requirement: Handle system not found (HTTP 404)
The function SHALL return a typed error result when the requested system DAT does not exist on GitHub.

#### Scenario: Unknown system name returns not-found error
- **WHEN** `fetchDat("Nonexistent - System")` is called and the server returns HTTP 404
- **THEN** the function returns a result with `ok: false` and `error.type` equal to `'not-found'`

### Requirement: Handle network errors
The function SHALL return a typed error result when the fetch request fails due to network issues.

#### Scenario: Network failure returns network-error
- **WHEN** `fetchDat("Nintendo - Game Boy")` is called and the network request throws
- **THEN** the function returns a result with `ok: false` and `error.type` equal to `'network-error'`

### Requirement: Support conditional fetch with ETag/Last-Modified
The function SHALL accept optional `ifNoneMatch` and `ifModifiedSince` parameters to enable conditional HTTP requests.

#### Scenario: Conditional fetch with matching ETag returns not-modified
- **WHEN** `fetchDat("Nintendo - Game Boy", { ifNoneMatch: "<etag>" })` is called and the server returns HTTP 304
- **THEN** the function returns a result with `ok: false` and `error.type` equal to `'not-modified'`

#### Scenario: Conditional fetch with stale ETag returns fresh content
- **WHEN** `fetchDat("Nintendo - Game Boy", { ifNoneMatch: "<stale-etag>" })` is called and the server returns HTTP 200
- **THEN** the function returns a successful result with fresh content and updated metadata

### Requirement: No side effects
The `fetchDat` function SHALL NOT write to disk, modify global state, or perform any operation beyond the HTTP request and response processing.

#### Scenario: Function is pure network I/O
- **WHEN** `fetchDat` is called
- **THEN** no files are created or modified on disk and no global state is changed

### Requirement: DatFetchOptions includes basePath
The `DatFetchOptions` type SHALL include an optional `basePath` field of type `string`. When provided, it replaces the default `dat` path segment in the fetch URL.

#### Scenario: basePath option type
- **WHEN** `DatFetchOptions` is used with `{ basePath: "metadat/genre" }`
- **THEN** the TypeScript compiler accepts the option without error
