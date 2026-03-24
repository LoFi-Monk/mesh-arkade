## Why

The Bare runtime doesn't provide Node built-ins (`fs`, `crypto`, `path`) or browser globals (`fetch`, `process`, `Buffer`). S1 needs `fetch`, S3 needs `fs`, and tests must pass in both Node (`brittle`) and Bare (`brittle-bare`). Without a compatibility layer, every module that touches I/O or networking would need runtime detection boilerplate.

Pear's official `node-compat` template solves this at the package resolution level — no custom abstraction needed.

## What Changes

- Add `npm:bare-node-*` dependency aliases to `package.json` for modules we use (`fs`, `crypto`, `path`)
- Create `compat.js` (plain JS, not TS) with global polyfills: `global.fetch`, `global.process`, `global.Buffer`
- Wire `require('./compat')` at the top of the entry point
- Verify tests pass in both `brittle` and `brittle-bare`
- Update CLAUDE.md Bare Runtime rules (already done — confirm accuracy post-implementation)

## Capabilities

### New Capabilities
- `bare-compat`: Runtime compatibility layer enabling Node built-in usage (`require('fs')`, `global.fetch`, etc.) across both Node and Bare runtimes via package.json aliases and a minimal polyfill script

### Modified Capabilities

None — no existing specs.

## Impact

- **`package.json`**: New `npm:` alias entries in dependencies
- **New file**: `compat.js` at project root (3 lines of global polyfills)
- **Entry point**: `index.ts` gets `require('./compat')` at top
- **Test runner**: Must validate both `brittle` (Node) and `brittle-bare` (Bare) pass
- **Downstream**: Unblocks S1 (fetch), S3 (fs), and any future module needing Node built-ins
