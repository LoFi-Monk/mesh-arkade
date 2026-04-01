## ADDED Requirements

### Requirement: Collection interface
The system SHALL define a `Collection` interface representing a user's verified game library. The interface SHALL include `id` (string), `name` (string), `ownerPublicKey` (string, identity public key), `gameCount` (number), and `createdAt` (number, Unix timestamp). Collections are owned by an Identity and tied to reputation. Implementation is deferred to CORE-009.

#### Scenario: Collection interface shape
- **WHEN** a `Collection` type is imported
- **THEN** it defines `id`, `name`, `ownerPublicKey`, `gameCount`, and `createdAt` fields

### Requirement: Playlist interface
The system SHALL define a `Playlist` interface representing a curated list of games owned by a child Profile. The interface SHALL include `id` (string), `name` (string), `profileId` (string, reference to owning child Profile), `gameCount` (number), and `createdAt` (number, Unix timestamp). Playlists are owned by a child Profile and have no reputation implications. Implementation is deferred to CORE-009.

#### Scenario: Playlist interface shape
- **WHEN** a `Playlist` type is imported
- **THEN** it defines `id`, `name`, `profileId`, `gameCount`, and `createdAt` fields

### Requirement: PlaylistEntry interface
The system SHALL define a `PlaylistEntry` interface representing a single game in a Playlist. The interface SHALL include `playlistId` (string), `crc` (string), and `addedAt` (number, Unix timestamp).

#### Scenario: PlaylistEntry interface shape
- **WHEN** a `PlaylistEntry` type is imported
- **THEN** it defines `playlistId`, `crc`, and `addedAt` fields

### Requirement: Collection stub methods on IdentityService
The `IdentityService` SHALL expose `getCollections(): Promise<Collection[]>` as a stub that returns an empty array. Implementation is deferred to CORE-009.

#### Scenario: getCollections returns empty
- **WHEN** `identityService.getCollections()` is called
- **THEN** an empty array is returned (stub — CORE-009 implements)

### Requirement: Playlist stub methods on IdentityService
The `IdentityService` SHALL expose `getPlaylists(profileId: string): Promise<Playlist[]>` as a stub that returns an empty array. Implementation is deferred to CORE-009.

#### Scenario: getPlaylists returns empty
- **WHEN** `identityService.getPlaylists(profileId)` is called
- **THEN** an empty array is returned (stub — CORE-009 implements)
