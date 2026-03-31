## ADDED Requirements

### Requirement: Collection interface
The system SHALL define a `Collection` interface representing a user's verified game library. The interface SHALL include `id` (string), `name` (string), `system` (string), and `gameCount` (number). Collections are owned by an Identity and tied to reputation. Implementation is deferred to CORE-009.

#### Scenario: Collection interface shape
- **WHEN** a `Collection` type is imported
- **THEN** it defines `id`, `name`, `system`, and `gameCount` fields

### Requirement: Playlist interface
The system SHALL define a `Playlist` interface representing a curated list of games drawn from a Collection. The interface SHALL include `id` (string), `name` (string), `collectionId` (string, reference to parent Collection), and `entries` (array of `PlaylistEntry`). Playlists are owned by a child Profile and have no reputation implications. Implementation is deferred to CORE-009.

#### Scenario: Playlist interface shape
- **WHEN** a `Playlist` type is imported
- **THEN** it defines `id`, `name`, `collectionId`, and `entries` fields

### Requirement: PlaylistEntry interface
The system SHALL define a `PlaylistEntry` interface representing a single game in a Playlist. The interface SHALL include `crc` (string) and `addedAt` (string, ISO date).

#### Scenario: PlaylistEntry interface shape
- **WHEN** a `PlaylistEntry` type is imported
- **THEN** it defines `crc` and `addedAt` fields

### Requirement: Collection stub methods on IdentityService
The `IdentityService` SHALL expose `getCollections(): Promise<Collection[]>` as a stub that returns an empty array. Implementation is deferred to CORE-009.

#### Scenario: getCollections returns empty
- **WHEN** `identityService.getCollections()` is called
- **THEN** an empty array is returned (stub — CORE-009 implements)

### Requirement: Playlist stub methods on ChildProfile access
The `IdentityService` SHALL expose `getPlaylists(profileId: string): Promise<Playlist[]>` as a stub that returns an empty array. Implementation is deferred to CORE-009.

#### Scenario: getPlaylists returns empty
- **WHEN** `identityService.getPlaylists(profileId)` is called
- **THEN** an empty array is returned (stub — CORE-009 implements)
