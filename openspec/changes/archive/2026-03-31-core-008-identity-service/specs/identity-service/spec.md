## ADDED Requirements

### Requirement: Identity interface
The system SHALL define an `Identity` interface representing a user's cryptographic identity on the mesh. The interface SHALL include `id` (string), `publicKey` (string, hex-encoded Hypercore public key), `displayName` (string), `ratio` (number, default 0), `rep` (number, default 0), and `trustScore` (number, default 0).

#### Scenario: Identity interface shape
- **WHEN** an `Identity` object is created
- **THEN** it contains `id`, `publicKey`, `displayName`, `ratio`, `rep`, and `trustScore` fields
- **THEN** `ratio`, `rep`, and `trustScore` default to 0

### Requirement: IdentityService interface
The system SHALL define an `IdentityService` interface with methods: `createIdentity(displayName: string)`, `getIdentity()`, and `hasIdentity()`. This replaces the `ProfileService` interface from CORE-007.

#### Scenario: IdentityService interface definition
- **WHEN** the `IdentityService` interface is imported
- **THEN** it defines `createIdentity(displayName: string): Promise<Identity>`, `getIdentity(): Promise<Identity | null>`, and `hasIdentity(): Promise<boolean>`

### Requirement: IdentityService implementation
The system SHALL provide an `IdentityService` class backed by a Corestore-managed Hypercore keypair. The identity core SHALL be derived via `store.get({ name: 'identity' })`. Identity metadata SHALL be stored in Hyperbee under the `identity/` key prefix.

#### Scenario: Create identity
- **WHEN** `identityService.createIdentity("Lofi")` is called for the first time
- **THEN** a Hypercore keypair is derived from the Corestore
- **THEN** display name "Lofi" is stored in Hyperbee at `identity/displayName`
- **THEN** the public key is stored at `identity/publicKey`
- **THEN** an `Identity` object is returned with all fields populated

#### Scenario: Create identity when one already exists
- **WHEN** `identityService.createIdentity("New Name")` is called and an identity already exists
- **THEN** an error is thrown indicating identity already exists

#### Scenario: Get existing identity
- **WHEN** `identityService.getIdentity()` is called after identity creation
- **THEN** the stored `Identity` object is returned with all fields

#### Scenario: Get identity when none exists
- **WHEN** `identityService.getIdentity()` is called before any identity is created
- **THEN** `null` is returned

#### Scenario: Check identity exists
- **WHEN** `identityService.hasIdentity()` is called after identity creation
- **THEN** `true` is returned

#### Scenario: Check identity does not exist
- **WHEN** `identityService.hasIdentity()` is called before any identity is created
- **THEN** `false` is returned

### Requirement: IdentityService construction
The system SHALL construct `IdentityService` with a `MeshStore` instance. The service SHALL use the store's existing Hyperbee and Corestore — no additional stores created.

#### Scenario: IdentityService construction
- **WHEN** `new IdentityService({ store })` is called with a MeshStore
- **THEN** an IdentityService instance is returned ready for use

### Requirement: IdentityServiceStub
The system SHALL provide an `IdentityServiceStub` class implementing `IdentityService` that always indicates no identity is available. This stub replaces `ProfileServiceStub` and is used in tests where identity is not under test.

#### Scenario: Stub returns no identity
- **WHEN** `stub.hasIdentity()` is called
- **THEN** `false` is returned

#### Scenario: Stub returns null identity
- **WHEN** `stub.getIdentity()` is called
- **THEN** `null` is returned

#### Scenario: Stub rejects creation
- **WHEN** `stub.createIdentity("name")` is called
- **THEN** an error is thrown

### Requirement: IdentityRequiredError
The system SHALL provide an `IdentityRequiredError` class extending `Error`. This replaces `ProfileRequiredError`.

#### Scenario: IdentityRequiredError construction
- **WHEN** `new IdentityRequiredError()` is called
- **THEN** an error with name `IdentityRequiredError` and default message `"Identity required for this operation"` is created
