## ADDED Requirements

### Requirement: Local Virtual Mounting
The system SHALL use a `Hyperdrive` initialized with a `Localdrive` backend to create a virtual mirror of verified ROMs. The drive SHALL logically map verified ROM file paths from the manifest to standard internal paths without copying the bytes.

#### Scenario: Mount verified file
- **WHEN** a file in the collection manifest is marked as "verified"
- **THEN** it is added to the virtual mirror `Hyperdrive` via the `Localdrive` backend
- **THEN** no additional disk space is used for the file content

### Requirement: Merkle Verification Failure Handling
The system SHALL catch read errors resulting from Merkle tree mismatches. If a file mapped in the virtual mirror is modified on disk by the user, the read SHALL fail safely.

#### Scenario: Merkle mismatch triggers re-scan
- **WHEN** a mapped file is modified and an external read is attempted
- **THEN** the `Hyperdrive` read fails due to a Merkle tree validation error
- **THEN** the failure is logged and the specific file is flagged for re-scanning
