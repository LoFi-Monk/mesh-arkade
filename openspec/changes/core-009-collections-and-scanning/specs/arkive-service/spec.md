## MODIFIED Requirements

### Requirement: Collection methods throw IdentityRequiredError
ArkiveService SHALL include collection methods (`addCollection`, `listCollections`, `scanCollection`) that throw `IdentityRequiredError` when called without an IdentityService or when the identity indicates no active user. When an active identity is present, these methods SHALL execute the collection lifecycle operations.

#### Scenario: Collection method without identity
- **WHEN** `arkive.addCollection(...)` is called with no IdentityService attached
- **THEN** an `IdentityRequiredError` is thrown

#### Scenario: Collection method with identity
- **WHEN** `arkive.addCollection(...)` is called with a valid IdentityService
- **THEN** the collection is registered and its UUID is returned

#### Scenario: List collections with identity
- **WHEN** `arkive.listCollections()` is called with a valid IdentityService
- **THEN** an array of registered collections with their connected status is returned

#### Scenario: Scan collection with identity
- **WHEN** `arkive.scanCollection(uuid)` is called with a valid IdentityService
- **THEN** the collection is scanned and a summary of the results is returned
