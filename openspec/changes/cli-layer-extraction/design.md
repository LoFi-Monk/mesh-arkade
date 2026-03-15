## Context

`index.js` is the dual-mode entry point for MeshARKade — it handles both GUI (Electron) and CLI (Bare/Node) boot paths. Over milestones 02–04, CLI command handlers were added directly into this file, growing it to 789 lines with mixed concerns: environment detection, REPL management, command dispatch, output formatting, and a first-run wizard. The file has zero test coverage.

The core modules (`hub.ts`, `curator.ts`, `curation.ts`, `database.ts`) are well-structured with clean boundaries. The problem is entirely in the CLI/entry layer.

## Goals / Non-Goals

**Goals:**
- Extract all CLI command handlers into individual, testable modules
- Reduce `index.js` to a thin boot shell (~100 lines)
- Establish a `src/cli/` directory as the CLI layer boundary
- Fix deferred bugs surfaced during Devin review (hub resource leak, loose system matching, dead code)
- Achieve test coverage on all extracted command modules

**Non-Goals:**
- Changing CLI command behavior or syntax (pure refactor — identical UX)
- Refactoring core modules (that's Phase 04b)
- Adding new CLI commands (that's milestone-05)
- Touching the GUI/Electron boot path beyond minimal cleanup

## Decisions

### 1. Command Module Interface

Each command exports a single async handler function with a consistent signature:

```typescript
export async function handle(argsStr: string, hub: CoreHub, options: CommandOptions): Promise<void>
```

Where `CommandOptions` carries cross-cutting concerns:
```typescript
interface CommandOptions {
  isJson: boolean;
  isSilent: boolean;
}
```

**Rationale:** Uniform interface enables a generic dispatch table in `index.js`. Commands receive the hub instance explicitly (no globals). Output mode is passed in, not checked inline.

**Alternative considered:** Command class pattern with `execute()` method. Rejected — overkill for stateless handlers, adds ceremony without benefit at this scale.

### 2. Formatter Module

Extract a `src/cli/formatter.ts` that provides:
```typescript
export function output(data: unknown, options: CommandOptions): void
export function table(rows: Record<string, string>[], options: CommandOptions): void
export function error(message: string, options: CommandOptions): void
```

**Rationale:** Commands currently have inline `if (isJson) { console.log(JSON.stringify(...)) } else { ... }` blocks. Centralizing this eliminates duplication and makes output testable.

### 3. Dispatch Table in index.js

Replace the `handleCommand()` switch-case with a map:

```javascript
const commands = {
  mount: () => import('./src/cli/commands/mount.js'),
  unmount: () => import('./src/cli/commands/unmount.js'),
  search: () => import('./src/cli/commands/search.js'),
  // ...
};
```

**Rationale:** Lazy imports via dynamic `import()` keep startup fast. Adding a new command is a single line, not a switch case. Works with both Bare and Node.

### 4. Environment Detection Unification

`index.js` currently does inline runtime detection. Replace with calls to existing `environment.ts` module.

**Rationale:** `environment.ts` already exists and is tested. No reason to duplicate.

### 5. Bug Fixes Bundled

- **Hub `stop()` resource leak**: Add `closeDatabase()` call in `CoreHub.stop()`.
- **`getSystemDefinition` loose matching**: Change `.includes()` to exact `id` match first, then alias lookup via `SYSTEM_ALIASES`. No fuzzy fallback.
- **Dead `askQuestion`**: Remove from `bootBare()`.
- **Unused `drawProgressBar`**: Move to `formatter.ts` for milestone-05 use, or remove if not wired up by end of this PR.

## Risks / Trade-offs

- **[Risk] Dynamic imports may behave differently on Bare vs Node** → Mitigation: Test both paths. Bare supports dynamic `import()` natively. Fall back to require() if needed.
- **[Risk] Changing hub.stop() could affect teardown order** → Mitigation: Call `closeDatabase()` before closing the corestore. Add test for stop sequence.
- **[Risk] Refactor introduces regressions in CLI behavior** → Mitigation: Run full E2E verification (`systems`, `init --seed=nes`, `search Mario`) before and after. Tests cover each command in isolation.
- **[Trade-off] Commands still use console.log for output** → Acceptable for CLI. A proper output stream abstraction is overkill at this stage.
