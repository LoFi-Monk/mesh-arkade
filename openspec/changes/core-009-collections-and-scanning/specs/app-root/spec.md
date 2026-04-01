## MODIFIED Requirements

### Requirement: Config file skeleton
The `config.json` SHALL be created with a minimal schema including `version` (string, app version) and `collections` (array of objects). The collections array SHALL track registered collections by storing their `uuid`, `name`, and `path`.

#### Scenario: Initial config.json content
- **WHEN** `config.json` is created on first run
- **THEN** it contains `{ "version": "<app-version>", "collections": [] }`

#### Scenario: Config.json with collections
- **WHEN** a collection is registered
- **THEN** the `collections` array in `config.json` is updated with an object containing `uuid`, `name`, and `path`
