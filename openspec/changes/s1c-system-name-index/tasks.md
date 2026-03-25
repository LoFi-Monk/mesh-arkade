## 1. Types

- [x] 1.1 Define `SystemIndexResult` type: `{ ok: true, systems: string[] }`
- [x] 1.2 Define `SystemIndexError` type: `{ ok: false, error: { type: 'network-error' | 'rate-limited', message: string, url: string } }`
- [x] 1.3 Export types from `src/dat/types.ts`

## 2. Core Implementation

- [x] 2.1 Create `src/dat/systems.ts` with `fetchSystemIndex(): Promise<SystemIndexResult | SystemIndexError>`
- [x] 2.2 Fetch from `https://api.github.com/repos/libretro/libretro-database/contents/dat`
- [x] 2.3 Filter response to entries with `type: "file"` and `.dat` extension
- [x] 2.4 Strip `.dat` extension from filenames to produce canonical system names
- [x] 2.5 Handle HTTP 200: parse JSON, extract system names, return `SystemIndexResult`
- [x] 2.6 Handle HTTP 403: return `SystemIndexError` with `type: 'rate-limited'`
- [x] 2.7 Handle fetch throw (network failure): return `SystemIndexError` with `type: 'network-error'`
- [x] 2.8 Add `resolveSystemName(query: string, systems: string[]): string[]` — case-insensitive substring match
- [x] 2.9 Add TSDoc with `@intent`, `@guarantee`, `@constraint` tags to all exported symbols

## 3. Tests

- [x] 3.1 Create `test/systems.test.ts` with test setup importing compat
- [x] 3.2 Test: successful fetch returns array of system names (mock fetch with 200 response)
- [x] 3.3 Test: system names are parsed from filenames (`.dat` extension stripped)
- [x] 3.4 Test: non-file entries (type: "dir") are excluded
- [x] 3.5 Test: non-.dat files are excluded
- [x] 3.6 Test: network error returns `{ ok: false, error: { type: 'network-error' } }`
- [x] 3.7 Test: 403 response returns `{ ok: false, error: { type: 'rate-limited' } }`
- [x] 3.8 Test: `resolveSystemName("NES", systems)` returns matching system names
- [x] 3.9 Test: `resolveSystemName` is case-insensitive
- [x] 3.10 Test: `resolveSystemName("Game Boy", systems)` returns multiple matches
- [x] 3.11 Test: `resolveSystemName("nonexistent", systems)` returns empty array

## 4. Integration & Validation

- [x] 4.1 Export `fetchSystemIndex`, `resolveSystemName`, and types from `src/dat/index.ts` barrel
- [x] 4.2 Run `npm run lint` — fix any errors
- [x] 4.3 Run `npm test` — all tests pass in both Node and Bare
- [x] 4.4 Run `npm run precommit` — full pipeline green
