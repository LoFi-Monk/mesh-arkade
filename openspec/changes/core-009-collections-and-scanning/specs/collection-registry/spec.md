## ADDED Requirements

### Requirement: Register collection
The system SHALL provide a mechanism to register a new collection by its absolute path. When registered, the system MUST generate a unique UUID for the collection, create a `.mesh-arkade/` directory at the target path, and save a `collection.json` file containing the UUID inside that directory.

#### Scenario: Registering a new collection
- **WHEN** a valid absolute path is provided for registration
- **THEN** a UUID is generated
- **THEN** `.mesh-arkade/collection.json` is created at the path with the UUID
- **THEN** the collection is added to the global App Root registry

### Requirement: Discover collections
The system SHALL provide a mechanism to verify the status of registered collections on startup or when requested. It MUST check the last known absolute path for the presence of the `.mesh-arkade/` directory and match the UUID.

#### Scenario: Collection is connected
- **WHEN** discovery runs and the `.mesh-arkade/collection.json` exists at the registered path with the matching UUID
- **THEN** the collection status is marked as "connected"

#### Scenario: Collection is disconnected
- **WHEN** discovery runs and the `.mesh-arkade/` directory does not exist at the registered path
- **THEN** the collection status is marked as "disconnected"
- **THEN** the collection is NOT removed from the registry
