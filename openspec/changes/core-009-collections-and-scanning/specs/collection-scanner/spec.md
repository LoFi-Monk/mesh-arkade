## ADDED Requirements

### Requirement: Directory walking
The system SHALL provide a non-blocking directory walker capable of recursively finding ROM files within a collection path based on recognized extensions (e.g., `.nes`).

#### Scenario: Walk collection directory
- **WHEN** the walker is pointed at a directory containing ROMs and subdirectories
- **THEN** it returns a flat list of absolute paths for all recognized ROM files

### Requirement: File hashing and verification
The scanner SHALL hash every discovered file using full-file hashing without header stripping (for NES, as verified in Phase 1). The scanner MUST perform a CRC lookup in the Hyperbee catalog for each hashed file.

#### Scenario: Verified ROM match
- **WHEN** a discovered file's hash matches an entry in the catalog
- **THEN** the file's status is recorded as "verified" along with its matched CRC and catalog name

#### Scenario: Unmatched ROM
- **WHEN** a discovered file's hash does not match any entry in the catalog
- **THEN** the file's status is recorded as "unmatched"

### Requirement: Manifest generation
The scanner SHALL write scan results to `.mesh-arkade/manifest.json`. The manifest MUST contain an array of objects mapping file paths to their CRC, status ("verified" or "unmatched"), matched name, and scan timestamp. The write MUST be atomic (write to `.tmp` and rename).

#### Scenario: Write scan manifest
- **WHEN** a scan completes
- **THEN** the `.mesh-arkade/manifest.json` file is atomically updated with the new scan results
