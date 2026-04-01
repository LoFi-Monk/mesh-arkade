## ADDED Requirements

### Requirement: Create App Root on first run
The system SHALL create the `~/mesh-arkade/` directory on first run if it does not exist. The directory SHALL contain a `config.json` file. The `DATs/` subdirectory SHALL NOT be created (ADR-0018).

#### Scenario: First run creates App Root
- **WHEN** `initAppRoot()` is called and `~/mesh-arkade/` does not exist
- **THEN** the directory is created with `config.json`
- **THEN** no `DATs/` subdirectory is created

#### Scenario: Subsequent runs skip creation
- **WHEN** `initAppRoot()` is called and `~/mesh-arkade/` already exists
- **THEN** no directories or files are created
- **THEN** the existing App Root path is returned

### Requirement: Config file skeleton
The `config.json` SHALL be created with a minimal schema including `version` (string, app version) and `collections` (empty array placeholder for CORE-009).

#### Scenario: Initial config.json content
- **WHEN** `config.json` is created on first run
- **THEN** it contains `{ "version": "<app-version>", "collections": [] }`

### Requirement: Resolve App Root path
The system SHALL provide a `getAppRootPath()` function that returns the resolved path to `~/mesh-arkade/` using `os.homedir()`.

#### Scenario: Path resolution
- **WHEN** `getAppRootPath()` is called
- **THEN** it returns the absolute path `<homedir>/mesh-arkade`

### Requirement: Bare runtime compatibility
The App Root module SHALL use `os.homedir()` which resolves via the `bare-node-os` alias in `package.json`. No Node-only APIs beyond what is aliased.

#### Scenario: Works with bare-node-os alias
- **WHEN** `getAppRootPath()` is called in a Bare-compatible environment
- **THEN** `os.homedir()` resolves correctly via the `bare-node-os` alias
