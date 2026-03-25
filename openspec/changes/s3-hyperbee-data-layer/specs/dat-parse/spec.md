## MODIFIED Requirements

### Requirement: Handle optional and partial checksum fields
The system SHALL treat all checksum fields (crc, md5, sha1, sha256) as optional on ROM entries.

#### Scenario: ROM with all checksums
- **WHEN** a ROM entry has crc, md5, and sha1 fields
- **THEN** all three are present on the parsed `DatRom`

#### Scenario: ROM with CRC only
- **WHEN** a ROM entry has only a crc field (no md5 or sha1)
- **THEN** `rom.crc` is populated, `rom.md5` and `rom.sha1` are `undefined`

#### Scenario: ROM with no checksums
- **WHEN** a ROM entry has only name and size (no checksum fields)
- **THEN** all checksum fields are `undefined`

#### Scenario: ROM with SHA256 field
- **WHEN** a ROM entry has a sha256 field
- **THEN** `rom.sha256` contains the uppercase-normalized hash value

### Requirement: Normalize checksum casing
The system SHALL normalize all checksum values (crc, md5, sha1, sha256) to uppercase.

#### Scenario: Mixed-case checksums normalized to uppercase
- **WHEN** a ROM entry has `crc abcd1234` and `sha1 AbCdEf0123456789...`
- **THEN** `rom.crc` is `"ABCD1234"` and `rom.sha1` is `"ABCDEF0123456789..."`

#### Scenario: SHA256 normalized to uppercase
- **WHEN** a ROM entry has a sha256 field with mixed-case value
- **THEN** `rom.sha256` is normalized to uppercase
