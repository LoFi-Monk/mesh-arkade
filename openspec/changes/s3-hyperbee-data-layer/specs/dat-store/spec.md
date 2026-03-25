## ADDED Requirements

### Requirement: Store lifecycle management
The system SHALL provide a `createStore(storagePath?)` function that initializes a Corestore and Hyperbee instance. The store SHALL default to `Pear.config.storage` when running in the Pear runtime and SHALL require an explicit path in Node/test environments. The store SHALL expose `ready()` and `close()` methods for lifecycle management. Hyperbee SHALL use `keyEncoding: 'utf-8'` and `valueEncoding: 'json'`.

#### Scenario: Create store in test environment
- **WHEN** `createStore('/tmp/test-store')` is called with an explicit path
- **THEN** a store object is returned with `ready()` and `close()` methods
- **THEN** after `await store.ready()`, the store accepts put/get operations

#### Scenario: Close store releases resources
- **WHEN** `await store.close()` is called on an open store
- **THEN** the Hyperbee and Corestore instances are closed
- **THEN** no further operations are accepted

### Requirement: Store parsed DAT data
The system SHALL provide a `storeDat(store, systemName, datFile)` function that writes all entries from a parsed `DatFile` into Hyperbee. For each `DatRom` in each `DatGame`, the system SHALL write one key per available hash type using the schema `dat:<canonical-system-name>:<hashType>:<HASH>`. Hash values in keys SHALL be normalized to uppercase. The stored value SHALL contain `gameName`, `romName`, `size`, and all other available hashes plus `serial` if present. The system SHALL also write a header key `dat:<canonical-system-name>:header` with the DAT file's `name` and `version`.

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

### Requirement: Look up ROM by hash with fallback
The system SHALL provide a `lookupRom(store, systemName, hash)` function that searches for a ROM entry by hash. The function SHALL normalize the input hash to uppercase, then attempt lookup in order: SHA1 key, MD5 key, CRC key. The function SHALL return the first match found, or null if no match exists. The result SHALL include which hash type matched.

#### Scenario: Lookup by SHA1 (first priority)
- **WHEN** `lookupRom(store, system, sha1Hash)` is called and a SHA1 key exists
- **THEN** the SHA1 entry is returned with `matchedBy: 'sha1'`

#### Scenario: Lookup falls back to MD5
- **WHEN** `lookupRom(store, system, hash)` is called and no SHA1 key exists but an MD5 key does
- **THEN** the MD5 entry is returned with `matchedBy: 'md5'`

#### Scenario: Lookup falls back to CRC
- **WHEN** `lookupRom(store, system, hash)` is called and no SHA1 or MD5 key exists but a CRC key does
- **THEN** the CRC entry is returned with `matchedBy: 'crc'`

#### Scenario: Lookup returns null for unknown hash
- **WHEN** `lookupRom(store, system, hash)` is called and no matching key exists for any hash type
- **THEN** null is returned

#### Scenario: Lookup normalizes lowercase input
- **WHEN** `lookupRom(store, system, "abc123")` is called with a lowercase hash
- **THEN** the lookup checks keys with `ABC123` (uppercase normalized)

### Requirement: Manage systems with atomic per-key operations
The system SHALL provide `addManagedSystem(store, systemName)` and `listManagedSystems(store)` functions. `addManagedSystem` SHALL write a single key `systems:managed:<canonical-system-name>` with value `true`. `listManagedSystems` SHALL perform a prefix scan on `systems:managed:` and return an array of system names.

#### Scenario: Add a managed system
- **WHEN** `addManagedSystem(store, "Nintendo - Nintendo Entertainment System")` is called
- **THEN** key `systems:managed:Nintendo - Nintendo Entertainment System` is set to `true`

#### Scenario: List managed systems
- **WHEN** `listManagedSystems(store)` is called after two systems have been added
- **THEN** an array of two canonical system names is returned

#### Scenario: Adding the same system twice is idempotent
- **WHEN** `addManagedSystem(store, system)` is called twice with the same system name
- **THEN** only one key exists and `listManagedSystems` returns one entry

### Requirement: Prefix scan for system entries
The system SHALL provide a way to enumerate all DAT entries for a given system using Hyperbee's `sub()` API. A prefix scan on `dat:<system>:` SHALL return all hash entries and the header for that system.

#### Scenario: Enumerate all entries for a system
- **WHEN** a prefix scan is performed on a system with 3 games, each having 3 hash keys
- **THEN** 9 hash entries plus 1 header entry are returned (10 total)

#### Scenario: Prefix scan for system with no stored data
- **WHEN** a prefix scan is performed on a system that has not been stored
- **THEN** an empty result set is returned
