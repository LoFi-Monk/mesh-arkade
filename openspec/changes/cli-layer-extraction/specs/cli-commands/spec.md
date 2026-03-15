## ADDED Requirements

### Requirement: Command modules are individually importable
Each CLI command SHALL be a separate module under `src/cli/commands/` exporting a single async handler function with the signature `handle(argsStr: string, hub: CoreHub, options: CommandOptions): Promise<void>`.

#### Scenario: Import a single command
- **WHEN** a consumer imports `src/cli/commands/search.ts`
- **THEN** it receives a module with an exported `handle` function

#### Scenario: Command receives hub instance
- **WHEN** a command handler is called
- **THEN** it receives the hub instance as a parameter (not accessed via global)

### Requirement: Command dispatch via lookup table
`index.js` SHALL dispatch commands via a map of command names to lazy-loaded modules, replacing the current switch-case in `handleCommand()`.

#### Scenario: Known command dispatched
- **WHEN** user enters `search Mario` in the REPL
- **THEN** the dispatcher loads `src/cli/commands/search.ts` and calls its `handle` function with `"Mario"` as argsStr

#### Scenario: Unknown command rejected
- **WHEN** user enters an unrecognized command
- **THEN** the dispatcher prints an error message and does not crash

### Requirement: index.js reduced to boot shell
`index.js` SHALL contain only environment detection, boot routing (GUI vs CLI), REPL loop, and command dispatch. All command logic, help rendering, wizard, and formatting MUST be extracted.

#### Scenario: index.js line count
- **WHEN** the refactor is complete
- **THEN** `index.js` SHALL be approximately 100 lines (no more than 150)

### Requirement: CLI argument parser extracted
The `parseArgs` function SHALL be extracted to `src/cli/parser.ts` and exported for use by both `index.js` and individual command tests.

#### Scenario: Parse key-value flag
- **WHEN** `parseArgs("--seed=nes")` is called
- **THEN** it returns `{ args: { seed: "nes" }, positional: [] }`

#### Scenario: Parse boolean flag with positional args
- **WHEN** `parseArgs("--json Mario Bros")` is called
- **THEN** it returns `{ args: { json: true }, positional: ["Mario", "Bros"] }`

### Requirement: First-run wizard extracted
The first-run wizard logic SHALL be extracted to `src/cli/wizard.ts` and called from the boot sequence.

#### Scenario: Wizard triggers on first run
- **WHEN** no mounts exist and the CLI boots
- **THEN** `wizard.ts` runs the interactive mount prompt

### Requirement: Help command extracted
Help text rendering SHALL be extracted from `index.js` into a dedicated command or utility module.

#### Scenario: Help displays all commands
- **WHEN** user runs `help` or `--help`
- **THEN** all available commands are listed with descriptions

### Requirement: Dead code removed
The unused `askQuestion` function in `bootBare` and the unwired `drawProgressBar` function SHALL be removed.

#### Scenario: No dead functions remain
- **WHEN** the refactor is complete
- **THEN** `index.js` contains no unused function declarations
