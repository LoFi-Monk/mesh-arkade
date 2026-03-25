## Why

`fetchDat()` requires the exact Libretro system name (e.g., `"Nintendo - Nintendo Entertainment System"`). Users won't know these names — they'll type "NES" or pick from a list. Before any user-facing feature can call `fetchDat()`, we need a way to discover what systems exist and resolve friendly names to canonical ones. The index must stay current automatically as Libretro adds new systems — no hardcoded list to maintain.

## What Changes

- Add a `fetchSystemIndex()` function that retrieves the list of available systems from the Libretro Database GitHub repository at runtime
- Parse system names from the `/dat/` directory listing (each `.dat` filename is a system name)
- Provide a `resolveSystemName()` function that maps user input to exact Libretro names via substring/case-insensitive matching
- Export types for the index structure and resolution results

## Capabilities

### New Capabilities
- `system-name-index`: Discover available systems from Libretro and resolve user-friendly names to canonical system names for use with `fetchDat()`

### Modified Capabilities

## Impact

- New module: `src/dat/systems.ts` (index fetching and name resolution)
- New types added to `src/dat/types.ts`
- New test file: `test/systems.test.ts`
- Barrel export updated: `src/dat/index.ts`
- Depends on `fetch` (via compat.js) — same as S1
- No changes to existing `fetchDat()` — this is additive
