## ADDED Requirements

### Requirement: Lazy module resolution
`runtime.ts` SHALL export async functions `getFs()`, `getPath()`, `getOs()` that return the appropriate module for the current runtime (Bare or Node). Each function MUST resolve the module on first invocation and return the cached result on subsequent calls.

#### Scenario: First call in Bare runtime
- **WHEN** `getFs()` is called and `typeof Bare !== "undefined"` is true
- **THEN** it returns the default export of `bare-fs`

#### Scenario: First call in Node runtime
- **WHEN** `getFs()` is called and `typeof Bare === "undefined"`
- **THEN** it returns the `fs` module from Node builtins

#### Scenario: Cached on subsequent calls
- **WHEN** `getFs()` has been called once and is called again
- **THEN** it returns the same cached module instance without re-importing

### Requirement: Fetch resolution with fallback chain
`runtime.ts` SHALL export an async function `getFetch()` that resolves a fetch implementation using the following priority: (1) `bare-fetch` if running in Bare, (2) `globalThis.fetch` if available, (3) `node-fetch` as final fallback. The result MUST be cached after first resolution.

#### Scenario: Fetch in Bare runtime
- **WHEN** `getFetch()` is called and `typeof Bare !== "undefined"` is true
- **THEN** it returns the default export of `bare-fetch`

#### Scenario: Fetch in Node with global fetch
- **WHEN** `getFetch()` is called in Node and `globalThis.fetch` exists
- **THEN** it returns `globalThis.fetch`

#### Scenario: Fetch in Node without global fetch
- **WHEN** `getFetch()` is called in Node and `globalThis.fetch` is undefined
- **THEN** it returns the default export of `node-fetch`

### Requirement: No internal imports
`runtime.ts` MUST NOT import from any other `src/` module. It SHALL only import from `bare-*` packages or Node builtins to prevent circular dependencies.

#### Scenario: Module dependency check
- **WHEN** `runtime.ts` is analyzed for import statements
- **THEN** all imports resolve to `bare-fs`, `bare-path`, `bare-os`, `bare-fetch`, `node-fetch`, `fs`, `path`, or `os` only

### Requirement: Consumer migration
All inline `if (typeof Bare !== "undefined")` import blocks in `database.ts`, `storage.ts`, `curator.ts`, and `curation.ts` SHALL be replaced with imports from `runtime.ts`.

#### Scenario: No remaining inline detection
- **WHEN** `database.ts`, `storage.ts`, `curator.ts`, and `curation.ts` are searched for `typeof Bare`
- **THEN** zero matches are found (excluding type declarations)
