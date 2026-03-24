## Why

ROM verification requires DAT files — without them, nothing can be checked. The Libretro Database on GitHub hosts CLRMamePro DAT files for every system we support. We need a function that fetches a DAT by system name and returns the raw content along with HTTP metadata for downstream caching (S3) and progress reporting (S1b).

## What Changes

- New `src/dat/fetch.ts` module with a `fetchDat(systemName)` function
- Takes a system name (e.g., "Nintendo - Game Boy"), returns raw DAT content as a string
- Returns HTTP response metadata (ETag, Last-Modified, Content-Length) alongside content
- Uses `global.fetch` (available via compat.js from S0b)
- Handles 404 (system not found) and network errors gracefully with typed errors
- URL pattern: `raw.githubusercontent.com/libretro/libretro-database/master/dat/<system>.dat`

## Capabilities

### New Capabilities
- `dat-fetch`: Fetch a CLRMamePro DAT file from the Libretro Database GitHub repository by system name, returning content and HTTP metadata

### Modified Capabilities

None.

## Impact

- **New module**: `src/dat/fetch.ts`
- **New tests**: `test/fetch.test.ts`
- **Dependencies**: None — uses `global.fetch` from compat.js
- **Downstream**: S1b (progress bar uses Content-Length), S2 (parser receives raw string), S3 (cache uses ETag/Last-Modified)
