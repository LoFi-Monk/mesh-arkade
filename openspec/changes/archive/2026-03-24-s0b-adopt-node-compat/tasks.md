## 1. Package Aliases

- [x] 1.1 Add `bare-node-fs`, `bare-node-crypto`, `bare-node-path` as `npm:` aliases in `package.json` dependencies (`"fs": "npm:bare-node-fs"`, etc.)
- [x] 1.2 Add `bare-node-fetch`, `bare-node-process`, `bare-node-buffer` as `npm:` aliases in `package.json` dependencies (needed by `compat.js`)
- [x] 1.3 Run `npm install` and verify aliases resolve without errors

## 2. Compat Polyfill

- [x] 2.1 Create `compat.js` at project root (plain JS) — assign `global.fetch`, `global.process`, `global.Buffer` from their `bare-node-*` equivalents, guarded by `typeof` checks to avoid overwriting Node natives
- [x] 2.2 Add `compat.js` to `tsconfig.json` `include` array if needed for the build to pick it up, or ensure it copies to `dist/` via build step

## 3. Entry Point Wiring

- [x] 3.1 Add `require('./compat')` as the first line in `index.ts`, before all other imports
- [x] 3.2 Verify `process.env` usage in `index.ts` still works after compat loads (logger debug flag)

## 4. Test Infrastructure

- [x] 4.1 Write `test/compat.test.ts` — verify `global.fetch` is a function, `global.process` has `env` and `cwd`, `global.Buffer` is a constructor, `require('fs')` returns an object with `readFile`/`writeFile`, `require('crypto')` returns an object with `createHash`, `require('path')` returns an object with `join`/`resolve`
- [x] 4.2 Add `test:node` npm script: `npm run build && brittle dist/test/*.test.js`
- [x] 4.3 Add `test:bare` npm script: `npm run build && brittle-bare dist/test/*.test.js`
- [x] 4.4 Update `test` npm script to run both (e.g., `npm run test:node && npm run test:bare`)
- [x] 4.5 Verify all existing tests (`logger.test.ts`, `index.test.ts`) pass in both runtimes
- [x] 4.6 Verify coverage threshold (80%) still passes

## 5. Validation & Cleanup

- [x] 5.1 Run `npm run lint` — fix any ESLint errors (compat.js may need eslint config adjustment for globals)
- [x] 5.2 Run full precommit: `npm run precommit`
- [x] 5.3 Confirm CLAUDE.md Bare Runtime section matches implementation (already updated — verify accuracy)
