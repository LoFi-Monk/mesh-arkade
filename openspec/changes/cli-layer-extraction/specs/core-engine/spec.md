## MODIFIED Requirements

### Requirement: Hub stop closes all resources
The `CoreHub.stop()` method SHALL close the Hyperbee database and Corestore in addition to stopping the curator and curation manager. Resources MUST be closed in reverse initialization order.

#### Scenario: Hub stop releases database
- **WHEN** `hub.stop()` is called
- **THEN** `closeDatabase()` is called before the corestore is closed
- **THEN** no file handles or connections remain open

#### Scenario: Hub stop is idempotent
- **WHEN** `hub.stop()` is called twice
- **THEN** the second call completes without error

### Requirement: System lookup uses exact match
The `getSystemDefinition` function SHALL match system IDs by exact equality first, then by alias lookup via `SYSTEM_ALIASES`. Loose `.includes()` matching MUST be removed.

#### Scenario: Exact ID match
- **WHEN** `getSystemDefinition("nes")` is called
- **THEN** it returns the NES system definition (not SNES)

#### Scenario: Alias match
- **WHEN** `getSystemDefinition("nintendo-entertainment-system")` is called
- **THEN** it resolves via `SYSTEM_ALIASES` to the NES system definition

#### Scenario: No match
- **WHEN** `getSystemDefinition("nonexistent")` is called
- **THEN** it returns `undefined`
