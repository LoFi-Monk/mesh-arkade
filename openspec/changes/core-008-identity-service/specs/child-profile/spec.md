## ADDED Requirements

### Requirement: ChildProfile interface
The system SHALL define a `ChildProfile` interface representing a child profile under a parent identity. The interface SHALL include `id` (string), `displayName` (string), `avatar` (string, default empty), `settings` (object for gaming preferences), and `active` (boolean).

#### Scenario: ChildProfile interface shape
- **WHEN** a `ChildProfile` object is created
- **THEN** it contains `id`, `displayName`, `avatar`, `settings`, and `active` fields

### Requirement: Create child profile
The `IdentityService` SHALL provide a `createProfile(displayName: string)` method that creates a new child profile under the current identity. The profile SHALL be stored in Hyperbee at `identity/profiles/<id>/`.

#### Scenario: Create first child profile
- **WHEN** `identityService.createProfile("Player 2")` is called with an active identity
- **THEN** a new `ChildProfile` is created with a unique ID
- **THEN** the profile is stored in Hyperbee under `identity/profiles/<id>/`
- **THEN** the created `ChildProfile` object is returned

#### Scenario: Create child profile without identity
- **WHEN** `identityService.createProfile("Player 2")` is called before identity creation
- **THEN** an `IdentityRequiredError` is thrown

### Requirement: List child profiles
The `IdentityService` SHALL provide a `getProfiles()` method that returns all child profiles for the current identity.

#### Scenario: List profiles with existing profiles
- **WHEN** `identityService.getProfiles()` is called after creating two child profiles
- **THEN** an array of two `ChildProfile` objects is returned

#### Scenario: List profiles with no profiles
- **WHEN** `identityService.getProfiles()` is called with no child profiles created
- **THEN** an empty array is returned

#### Scenario: List profiles without identity
- **WHEN** `identityService.getProfiles()` is called before identity creation
- **THEN** an `IdentityRequiredError` is thrown

### Requirement: Get active profile
The `IdentityService` SHALL provide a `getActiveProfile()` method that returns the currently active child profile, or `null` if no child profile is active (identity acts as default profile).

#### Scenario: Get active profile when one is set
- **WHEN** a child profile has been set as active
- **THEN** `identityService.getActiveProfile()` returns that `ChildProfile`

#### Scenario: Get active profile when none set
- **WHEN** no child profile has been set as active
- **THEN** `identityService.getActiveProfile()` returns `null`

#### Scenario: Get active profile without identity
- **WHEN** `identityService.getActiveProfile()` is called before identity creation
- **THEN** an `IdentityRequiredError` is thrown

### Requirement: Set active profile
The `IdentityService` SHALL provide a `setActiveProfile(profileId: string)` method that marks a child profile as active and deactivates any previously active profile.

#### Scenario: Set active profile
- **WHEN** `identityService.setActiveProfile(id)` is called with a valid profile ID
- **THEN** that profile's `active` field is set to `true`
- **THEN** any previously active profile is set to `false`

#### Scenario: Set active profile with invalid ID
- **WHEN** `identityService.setActiveProfile("nonexistent")` is called
- **THEN** an error is thrown indicating profile not found
