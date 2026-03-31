## MODIFIED Requirements

### Requirement: Store parsed DAT data
The system SHALL provide a `storeDat(store, systemName, datFile)` function that writes all entries from a parsed `DatFile` into Hyperbee. For each `DatRom` in each `DatGame`, the system SHALL write one key per available hash type using the schema `dat:<canonical-system-name>:<hashType>:<HASH>`. Hash values in keys SHALL be normalized to uppercase. The stored value SHALL be a `StoredRomEntry` containing `gameName`, `romName`, `size`, all available hashes, `serial` if present, and enrichment fields (`developer`, `genre`, `releaseyear`, `releasemonth`, `publisher`, `region`) when available. Enrichment fields SHALL be optional (undefined when not yet merged).

#### Scenario: Store a DAT file with CRC, MD5, and SHA1
- **WHEN** `storeDat(store, "Nintendo - Nintendo Entertainment System", datFile)` is called with a DatFile containing a game with one ROM having crc, md5, and sha1
- **THEN** three hash keys are written: `dat:Nintendo - Nintendo Entertainment System:sha1:<HASH>`, `dat:Nintendo - Nintendo Entertainment System:md5:<HASH>`, `dat:Nintendo - Nintendo Entertainment System:crc:<HASH>`
- **THEN** each value contains `gameName`, `romName`, `size`, and the other two hashes

#### Scenario: Store a DAT file with SHA256 present
- **WHEN** a `DatRom` has `sha256` defined in addition to crc, md5, sha1
- **THEN** a fourth key `dat:<system>:sha256:<HASH>` is written
- **THEN** all four hash values cross-reference each other in their stored values

#### Scenario: Store a DAT file with only CRC (missing MD5 and SHA1)
- **WHEN** a `DatRom` has only `crc` defined (md5 and sha1 are undefined)
- **THEN** only one key `dat:<system>:crc:<HASH>` is written
- **THEN** the stored value has `md5: undefined` and `sha1: undefined`

#### Scenario: Store a DAT header
- **WHEN** `storeDat` is called
- **THEN** a key `dat:<system>:header` is written with `{ name, version }` from the DatFile header

#### Scenario: ROM serial is preserved in stored value
- **WHEN** a `DatRom` has a `serial` field
- **THEN** the stored value includes `serial`

#### Scenario: Enrichment fields are preserved in stored value
- **WHEN** a `StoredRomEntry` includes enrichment fields (`developer`, `genre`, `releaseyear`, `releasemonth`, `publisher`, `region`)
- **THEN** those fields are included in the Hyperbee value

## ADDED Requirements

### Requirement: StoredRomEntry enrichment fields
The `StoredRomEntry` type SHALL include optional fields: `developer?: string`, `genre?: string`, `releaseyear?: string`, `releasemonth?: string`, `publisher?: string`, `region?: string`. All enrichment fields SHALL be optional to support incremental merge.

#### Scenario: StoredRomEntry with all enrichment fields
- **WHEN** a `StoredRomEntry` is created with developer, genre, releaseyear, releasemonth, publisher, and region
- **THEN** the TypeScript compiler accepts all fields without error

#### Scenario: StoredRomEntry with no enrichment fields
- **WHEN** a `StoredRomEntry` is created with only the base fields (gameName, romName, size, hashes)
- **THEN** the TypeScript compiler accepts it without error (enrichment fields are undefined)

### Requirement: Name-based index for search
The system SHALL provide a name index in Hyperbee mapping normalized game names to CRC values. The key schema SHALL be `dat:<system>:name:<normalized-name>` where `normalized-name` is the game name lowercased and trimmed. The value SHALL contain the CRC of the game's primary ROM.

#### Scenario: Name index entry created during store
- **WHEN** `storeDat` stores a game with name "Super Mario Bros. (World)" and CRC "3A3B5B05"
- **THEN** a key `dat:<system>:name:super mario bros. (world)` is written with value containing `crc: "3A3B5B05"`

#### Scenario: Name index lookup
- **WHEN** a prefix scan is performed on `dat:<system>:name:super mario`
- **THEN** all games whose normalized names start with "super mario" are returned

#### Scenario: Name index is rebuilt on re-store
- **WHEN** `storeDat` is called again with an updated DAT file
- **THEN** the name index entries reflect the updated game list
