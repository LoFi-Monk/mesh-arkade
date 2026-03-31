## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: DAT cache directory
**Reason:** ADR-0018 (Hyperbee-Only DAT Storage). Hyperbee is the sole DAT store. Raw XML caching in `DATs/` was redundant — storing data twice with no benefit. Export capabilities replace physical cache.
**Migration:** Remove `saveDatCache()` function. Remove `DATs/` directory creation from `initAppRoot()`. Remove all tests for `saveDatCache`. Any code importing `saveDatCache` must be updated to remove the import.
