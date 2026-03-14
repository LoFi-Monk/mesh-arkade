# Spec: Dynamic DAT Crawler

## Requirement: Repository Discovery
**WHEN** `mesh init --seed` is called for the first time or after cache expiry (24h)
**THEN** the system must query the GitHub API to discover available DAT files.

### Implementation Details
- API Endpoint: `https://api.github.com/repos/libretro/libretro-database/contents/dat`
- Output: A list of objects containing `name` and `download_url`.

## Requirement: System Mapping
**WHEN** the list of DAT files is retrieved
**THEN** the system must map the friendly names to internal IDs.

### Mapping Rules
- Remove prefixes like `Nintendo - `.
- Convert to kebab-case or short IDs (e.g. `nes`, `snes`).
- Filter out non-DAT files.

## Requirement: Resilient Fetching
**WHEN** downloading a raw DAT file
**THEN** the system must use the `download_url` provided by the API and handle network errors gracefully.

### Implementation Details
- User Agent: Must identify as `mesh-arkade/v1.0.0` or similar to follow GitHub API best practices.
- Error Handling: Retry on 5xx errors; abort on 404 (indicating the mirror changed).
