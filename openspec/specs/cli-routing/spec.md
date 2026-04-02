## ADDED Requirements

### Requirement: CLI command routing via process.argv
The system SHALL parse `process.argv` to determine the command and arguments. `process.argv[2]` SHALL be the command name. Remaining elements SHALL be command arguments.

#### Scenario: Command parsed from argv
- **WHEN** the CLI is invoked with `rkade catalog`
- **THEN** `process.argv[2]` is `"catalog"` and the catalog command handler is called

#### Scenario: Unknown command
- **WHEN** the CLI is invoked with `rkade unknown-command`
- **THEN** an error message is displayed with available commands

#### Scenario: No command provided
- **WHEN** the CLI is invoked with no arguments (just `rkade`)
- **THEN** a help/usage message is displayed

### Requirement: Catalog command
The CLI SHALL provide a `catalog` command that lists all NES game titles via `arkive.listTitles("nes")`.

#### Scenario: List NES catalog
- **WHEN** `rkade catalog` is invoked
- **THEN** all NES game titles are printed to stdout, one per line

#### Scenario: Empty catalog
- **WHEN** `rkade catalog` is invoked before any catalog refresh
- **THEN** a message indicates the catalog is empty and suggests running a refresh

### Requirement: Search command
The CLI SHALL provide a `search` command that searches NES titles by name prefix via `arkive.searchByName("nes", query)`.

#### Scenario: Search with results
- **WHEN** `rkade search "super mario"` is invoked
- **THEN** matching game titles are printed to stdout

#### Scenario: Search with no results
- **WHEN** `rkade search "zzz nonexistent"` is invoked
- **THEN** a message indicates no games were found

### Requirement: Info command
The CLI SHALL provide an `info` command that displays full metadata for a game via `arkive.getTitle("nes", crc)`.

#### Scenario: Info for known game
- **WHEN** `rkade info "3A3B5B05"` is invoked for a stored game
- **THEN** the full game metadata is displayed (name, hashes, developer, genre, year, publisher, region)

#### Scenario: Info for unknown game
- **WHEN** `rkade info "FFFFFFFF"` is invoked for a CRC not in the catalog
- **THEN** a message indicates the game was not found

### Requirement: CLI calls ArkiveService only
All CLI commands SHALL interact with the catalog exclusively through ArkiveService methods. No CLI command SHALL directly access Hyperbee, fetch, or parse modules.

#### Scenario: No direct Hyperbee access
- **WHEN** any CLI command is executed
- **THEN** all data access goes through ArkiveService method calls

### Requirement: ArkiveService initialization on startup
The CLI entry point SHALL initialize the App Root, create a store, and construct an ArkiveService instance before dispatching commands.

#### Scenario: Startup sequence
- **WHEN** the CLI is invoked with any command
- **THEN** App Root is initialized (idempotent), store is opened, ArkiveService is constructed, then the command is dispatched
