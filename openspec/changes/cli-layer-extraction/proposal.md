## Why

`index.js` is a 789-line monolith handling CLI parsing, command dispatch, REPL, GUI boot, help rendering, first-run wizard, and output formatting — with zero test coverage. Every new CLI command (e.g., `fetch` in milestone-05) increases the blast radius. Extracting the CLI layer makes commands independently testable, keeps `index.js` as a thin boot shell, and establishes clean boundaries for future milestones.

## What Changes

- Extract all CLI command handlers (`handleMount`, `handleUnmount`, `handleSearch`, `handleSystems`, `handleInit`, `handleReset`, `showStatus`) from `index.js` into individual modules under `src/cli/commands/`.
- Extract output formatting logic (JSON vs human-readable) into a shared `src/cli/formatter.ts`.
- Extract the first-run wizard into `src/cli/wizard.ts`.
- Extract CLI argument parsing into `src/cli/parser.ts`.
- Reduce `index.js` to ~100 lines: environment detection (via existing `environment.ts`), boot routing, and REPL loop with command dispatch.
- Fix deferred bugs: Hub `stop()` resource leak, `getSystemDefinition` loose `.includes()` matching, remove dead `askQuestion`, wire up or remove `drawProgressBar`.
- Add test coverage for all extracted command modules.

## Capabilities

### New Capabilities
- `cli-commands`: Individual CLI command handlers as testable modules with unified dispatch interface.
- `cli-formatting`: Output formatting abstraction (JSON/human-readable) decoupled from command logic.

### Modified Capabilities
- `core-engine`: Hub `stop()` must close Hyperbee/Corestore. `getSystemDefinition` must use exact match with alias fallback instead of loose `.includes()`.

## Impact

- **Code**: `index.js` restructured. New `src/cli/` directory. Minor fixes in `src/core/hub.ts` and `src/core/curation.ts`.
- **Tests**: New test files for each extracted command. Existing tests unaffected.
- **APIs**: No external API changes. CLI commands behave identically.
- **Dependencies**: No new dependencies.
