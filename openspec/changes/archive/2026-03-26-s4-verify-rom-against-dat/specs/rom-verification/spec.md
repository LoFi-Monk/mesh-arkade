## ADDED Requirements

### Requirement: ROM Hashing
The system MUST compute CRC32 and SHA1 hashes for a given file simultaneously via streams.

#### Scenario: Hash calculation
- **WHEN** a mock ROM file path is provided to the hashing function
- **THEN** the system MUST stream the file without loading it entirely into memory
- **THEN** the system MUST return the CRC32 and SHA1 hashes as strings

### Requirement: ROM Verification
The system MUST look up a ROM's hash in the cached Hyperbee DAT database and return a verified or unknown status.

#### Scenario: Verified ROM
- **WHEN** the ROM's hash exists in the Hyperbee database for the provided system
- **THEN** the system MUST return a `Verified` status along with the matched DAT entry metadata

#### Scenario: Unknown ROM
- **WHEN** the ROM's hash does not exist in the Hyperbee database for the provided system
- **THEN** the system MUST return an `Unknown` status

#### Scenario: O(1) Database Lookup
- **WHEN** performing the verification
- **THEN** the system MUST query the Hyperbee database using the hash as the direct key, without performing a linear scan

### Requirement: Copyright-Safe Testing
The system MUST be tested using dynamically generated mock data rather than real ROM files.

#### Scenario: CI Testing
- **WHEN** the integration tests execute the verification pipeline
- **THEN** the tests MUST generate a mock buffer as the ROM file and a corresponding mock DAT entry in the test database