## ADDED Requirements

### Requirement: Fetch available system names from Libretro Database
The system SHALL provide a `fetchSystemIndex()` function that retrieves the list of available system names from the Libretro Database GitHub repository by querying the Contents API for the `/dat/` directory.

#### Scenario: Successful fetch returns array of system names
- **WHEN** `fetchSystemIndex()` is called and the GitHub API returns a 200 response
- **THEN** the function returns a result with `ok: true` and `systems` containing an array of canonical system names (e.g., `["Nintendo - Nintendo Entertainment System", "Nintendo - Game Boy", ...]`)

#### Scenario: System names are parsed from filenames
- **WHEN** the API response contains entries like `{ name: "Nintendo - Game Boy.dat", type: "file" }`
- **THEN** the `.dat` extension is stripped and the result includes `"Nintendo - Game Boy"`

#### Scenario: Non-file entries are excluded
- **WHEN** the API response contains entries with `type: "dir"` or other non-file types
- **THEN** those entries are excluded from the result

#### Scenario: Only .dat files are included
- **WHEN** the API response contains files without a `.dat` extension
- **THEN** those entries are excluded from the result

### Requirement: Handle network and API errors
The function SHALL return typed error results for network failures and GitHub API errors, consistent with the `fetchDat()` error pattern.

#### Scenario: Network failure returns network-error
- **WHEN** `fetchSystemIndex()` is called and the network request throws
- **THEN** the function returns a result with `ok: false` and `error.type` equal to `'network-error'`

#### Scenario: Rate limit returns rate-limited error
- **WHEN** `fetchSystemIndex()` is called and the GitHub API returns HTTP 403
- **THEN** the function returns a result with `ok: false` and `error.type` equal to `'rate-limited'`

### Requirement: Resolve user input to canonical system names
The system SHALL provide a `resolveSystemName(query, systems)` function that performs case-insensitive substring matching against an array of canonical system names.

#### Scenario: Exact substring match returns single result
- **WHEN** `resolveSystemName("Super Nintendo", systems)` is called with a systems array containing `"Nintendo - Super Nintendo Entertainment System"`
- **THEN** the function returns an array containing `"Nintendo - Super Nintendo Entertainment System"`
- **NOTE**: Acronym resolution (e.g., "NES" → "Nintendo - Nintendo Entertainment System") requires alias mapping and is deferred to a future story. Substring matching resolves partial names, not abbreviations.

#### Scenario: Partial match returns multiple results
- **WHEN** `resolveSystemName("Game Boy", systems)` is called with a systems array containing `"Nintendo - Game Boy"`, `"Nintendo - Game Boy Advance"`, and `"Nintendo - Game Boy Color"`
- **THEN** the function returns an array containing all three matching system names

#### Scenario: Match is case-insensitive
- **WHEN** `resolveSystemName("game boy", systems)` is called
- **THEN** the function returns the same results as `resolveSystemName("GAME BOY", systems)`

#### Scenario: No match returns empty array
- **WHEN** `resolveSystemName("nonexistent", systems)` is called
- **THEN** the function returns an empty array

### Requirement: No side effects
The `fetchSystemIndex()` and `resolveSystemName()` functions SHALL NOT write to disk, modify global state, or perform any operation beyond the HTTP request (for fetch) and string matching (for resolve).

#### Scenario: Functions are pure
- **WHEN** either function is called
- **THEN** no files are created or modified on disk and no global state is changed
