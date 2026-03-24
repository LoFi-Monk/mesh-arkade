## Context

The project targets both Node (for development/testing via `brittle`) and Bare (production runtime via `brittle-bare` and `pear run`). Currently there's no compatibility layer — the entry point uses `process.env` and `Pear` globals directly. S1 needs `fetch` and S3 needs `fs`, neither of which exist in Bare without explicit wiring.

Pear's official `node-compat` template provides a proven pattern: `package.json` npm aliases resolve `require('fs')` to `bare-node-fs`, and a `compat.js` polyfill sets `global.fetch`/`global.process`/`global.Buffer`.

Current state:
- Entry point: `index.ts` — uses `process.env`, `Pear` global
- Dependencies: `pino` (production), dev tooling (`brittle`, `typescript`, `eslint`, `husky`)
- Test script: `npm run build && brittle-bare dist/test/*.test.js`
- No `compat.js`, no `bare-node-*` aliases

## Goals / Non-Goals

**Goals:**
- `require('fs')`, `require('crypto')`, `require('path')` resolve correctly in both Node and Bare
- `global.fetch` available in both runtimes
- Tests pass in both `brittle` (Node) and `brittle-bare` (Bare)
- Minimal alias set — only add what we use now, expand later

**Non-Goals:**
- Full 75-alias coverage from Pear's template (we add only what we need)
- TypeScript for `compat.js` (plain JS — 3 lines, no types needed, matches Pear template)
- Polyfilling `window`, `document`, or any browser globals
- Changing the build pipeline or module resolution strategy

## Decisions

### 1. compat.js as plain JavaScript, not TypeScript

**Choice:** `compat.js` stays as `.js`

**Rationale:** It's 3 lines of global assignment (`global.fetch`, `global.process`, `global.Buffer`). TypeScript adds nothing — no interfaces, no generics, no complex logic. Matching Pear's template exactly means any Pear developer recognizes it immediately.

**Alternative considered:** `compat.ts` for consistency — rejected because the file has no type surface worth checking.

### 2. Minimal alias set (fs, crypto, path)

**Choice:** Start with only `fs`, `crypto`, `path` as `npm:bare-node-*` aliases.

**Rationale:** These are the modules S1–S3 need. Adding all 75 aliases from the full template creates unnecessary dependency noise. New aliases are trivial to add as needed.

**Alternative considered:** Full template aliases — rejected as premature.

### 3. compat.js loaded via require() at entry point top

**Choice:** `require('./compat')` as the first line in `index.ts`.

**Rationale:** Polyfills must execute before any module import that uses `fetch`, `process`, or `Buffer`. Using `require()` (synchronous, CommonJS-style) ensures execution order. This matches Pear's template pattern exactly.

### 4. Test validation strategy

**Choice:** Add a `test:node` script (`brittle`) alongside existing `test` script (`brittle-bare`). Both must pass.

**Rationale:** The whole point of node-compat is dual-runtime support. If we only test in one runtime, we can't verify the compat layer works. Existing tests already run in Bare via `brittle-bare`; adding a Node test run catches regressions in either direction.

## Risks / Trade-offs

- **[Risk] `bare-node-*` packages may have incomplete API coverage** → Mitigation: We only use basic `fs.readFile`/`fs.writeFile` (S3) and `crypto.createHash` (future verification). These are core APIs that bare-node packages cover. Check API surface during implementation.
- **[Risk] `compat.js` require order is fragile** → Mitigation: Entry point has a clear comment explaining why it must be first. Linting or a test can catch if it gets moved.
- **[Risk] `pino` may not work in Bare** → Mitigation: `pino/browser` (already in use) is pure JS with no Node dependencies. Not a compat concern.
