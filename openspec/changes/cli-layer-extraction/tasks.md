## 1. Scaffold CLI Layer

- [x] 1.1 Create `src/cli/` directory structure: `commands/`, `formatter.ts`, `parser.ts`, `wizard.ts`
- [x] 1.2 Define `CommandOptions` interface and command handler type in `src/cli/types.ts`
- [x] 1.3 Extract `parseArgs()` from `index.js` into `src/cli/parser.ts` with TypeScript types

## 2. Extract Formatter

- [x] 2.1 Create `src/cli/formatter.ts` with `output()`, `table()`, and `error()` functions
- [x] 2.2 Support JSON and human-readable modes via `CommandOptions.isJson`
- [x] 2.3 Move table rendering logic (from `handleListMounts` column alignment) into `formatter.table()`

## 3. Extract Command Handlers

- [x] 3.1 Extract `handleMount()` → `src/cli/commands/mount.ts`
- [x] 3.2 Extract `handleUnmount()` → `src/cli/commands/unmount.ts`
- [x] 3.3 Extract `handleListMounts()` → `src/cli/commands/list.ts`
- [x] 3.4 Extract `handleSystems()` → `src/cli/commands/systems.ts`
- [x] 3.5 Extract `handleInit()` → `src/cli/commands/init.ts`
- [x] 3.6 Extract `handleSearch()` → `src/cli/commands/search.ts`
- [x] 3.7 Extract `handleReset()` → `src/cli/commands/reset.ts`
- [x] 3.8 Extract `showStatus()` → `src/cli/commands/status.ts`
- [x] 3.9 Extract `showHelp()` → `src/cli/commands/help.ts`
- [x] 3.10 All commands use formatter module instead of inline `if (isJson)` checks

## 4. Extract Wizard

- [x] 4.1 Extract `runFirstRunWizard()` → `src/cli/wizard.ts`
- [x] 4.2 Wizard receives `hubInstance` and `readline` interface as parameters (no globals)

## 5. Refactor index.js

- [x] 5.1 Replace `handleCommand()` switch-case with command dispatch table (lazy imports)
- [x] 5.2 Replace inline environment detection with calls to `environment.ts`
- [x] 5.3 Remove dead `askQuestion` function from `bootBare()`
- [x] 5.4 Remove or relocate `drawProgressBar` (move to formatter if keeping, delete if not)
- [x] 5.5 Verify `index.js` is under 150 lines

## 6. Bug Fixes

- [x] 6.1 Hub `stop()`: call `closeDatabase()` in `CoreHub.stop()` before closing corestore
- [x] 6.2 `getSystemDefinition`: replace `.includes()` with exact ID match + `SYSTEM_ALIASES` lookup
- [x] 6.3 Add idempotency guard to `hub.stop()` (safe to call twice)

## 7. Tests

- [x] 7.1 Add tests for `src/cli/parser.ts` (flag parsing, positional args, edge cases)
- [x] 7.2 Add tests for `src/cli/formatter.ts` (JSON mode, human mode, table, error)
- [x] 7.3 Add tests for each command handler (mock hub, verify output)
- [x] 7.4 Add tests for `hub.stop()` resource cleanup
- [x] 7.5 Add tests for `getSystemDefinition` exact match behavior
- [x] 7.6 All 120+ existing tests still pass
- [x] 7.7 Coverage remains above 80% threshold

## 8. Verification

- [x] 8.1 E2E: `node index.js --silent systems` lists systems
- [x] 8.2 E2E: `node index.js --silent init --seed=nes` seeds NES DAT
- [x] 8.3 E2E: `node index.js --silent search "Mario"` returns results
- [x] 8.4 E2E: `node index.js --silent search --system=nes` lists NES games
- [x] 8.5 `npm test` passes
- [x] 8.6 `npm run typecheck` clean
