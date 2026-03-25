## Why

S1 fetches raw DAT file content from the Libretro Database. That content is a CLRMamePro-format text blob — useless until parsed into typed data. Without a parser, there's no path to ROM verification (S4) or Hyperbee storage (S3). This is the critical bridge between fetching DAT content and doing anything useful with it.

## What Changes

- New `parseDat(content)` function that converts CLRMamePro format strings into typed `DatFile` structures
- New types: `DatFile`, `DatHeader`, `DatGame`, `DatRom`, `DatParseResult`, `DatParseError`
- Barrel export updated in `src/dat/index.ts`
- Custom parser — no external dependencies (robloach-datfile is Bare-incompatible)

## Capabilities

### New Capabilities
- `dat-parse`: Parse CLRMamePro format DAT content into typed in-memory structures with header metadata, game entries, nested multi-ROM entries, and checksum normalization. Handles malformed input with typed error results.

### Modified Capabilities
_(none — `dat-fetch` is unchanged, the parser consumes its output without modifying it)_

## Impact

- **New file:** `src/dat/parser.ts` — the parser implementation
- **Modified file:** `src/dat/types.ts` — new types added
- **Modified file:** `src/dat/index.ts` — barrel export updated
- **New file:** `test/parser.test.ts` — test suite using NES DAT fixture data
- **Dependencies:** None — pure string processing, zero external deps
- **Bare compatibility:** Fully compatible — no Node APIs, no streams, no fs
