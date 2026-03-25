## ADDED Requirements

### Requirement: Parse CLRMamePro DAT content into typed structure
The system SHALL provide a `parseDat(content: string)` function that parses CLRMamePro format DAT content into a typed `DatFile` structure containing header metadata and game entries with nested ROM data.

#### Scenario: Successful parse of a valid DAT string
- **WHEN** `parseDat(content)` is called with a valid CLRMamePro DAT string containing a header block and game entries
- **THEN** the function returns `{ ok: true, dat: DatFile }` where `dat.header` contains parsed metadata and `dat.games` contains an array of `DatGame` entries

#### Scenario: Header-only DAT with no games
- **WHEN** `parseDat(content)` is called with a valid header block but zero game blocks
- **THEN** the function returns `{ ok: true, dat }` where `dat.games` is an empty array and `dat.header` is populated

#### Scenario: Malformed content returns typed error
- **WHEN** `parseDat(content)` is called with content that has unmatched parentheses or invalid structure
- **THEN** the function returns `{ ok: false, error: { type: 'parse-error', message: string, line?: number } }`

### Requirement: Extract header metadata
The system SHALL extract header metadata from the first `clrmamepro (...)` or `header (...)` block in the DAT content.

#### Scenario: Parse clrmamepro header block
- **WHEN** the DAT content contains a `clrmamepro (...)` block with name, description, version, author, homepage, and url fields
- **THEN** `dat.header` contains all six fields with their string values

#### Scenario: Parse header block with alternate name
- **WHEN** the DAT content uses `header (...)` instead of `clrmamepro (...)`
- **THEN** the block is parsed identically to a `clrmamepro` block

#### Scenario: Optional header fields
- **WHEN** the header block omits `homepage` or `url` fields
- **THEN** those fields are `undefined` on the parsed `DatHeader`

### Requirement: Extract game entries with nested ROM data
The system SHALL extract all `game (...)` blocks and their nested `rom (...)` blocks into `DatGame` entries with `DatRom` arrays.

#### Scenario: Single ROM per game
- **WHEN** a game block contains one `rom (...)` entry with name, size, crc, md5, and sha1
- **THEN** `game.roms` contains one `DatRom` with all fields populated

#### Scenario: Multiple ROMs per game
- **WHEN** a game block contains multiple `rom (...)` entries
- **THEN** `game.roms` contains all ROM entries in order

#### Scenario: Inline ROM entry on single line
- **WHEN** a ROM block is written on a single line: `rom ( name "file.gb" size 1048576 crc ABCD1234 )`
- **THEN** the ROM is parsed identically to a multi-line ROM block

#### Scenario: Game with optional fields
- **WHEN** a game block includes `description` and `comment` fields
- **THEN** those fields are present on the parsed `DatGame`

#### Scenario: Game without optional fields
- **WHEN** a game block contains only `name` and `rom` entries (no description or comment)
- **THEN** `game.description` and `game.comment` are `undefined`

### Requirement: Handle optional and partial checksum fields
The system SHALL treat all checksum fields (crc, md5, sha1) as optional on ROM entries.

#### Scenario: ROM with all checksums
- **WHEN** a ROM entry has crc, md5, and sha1 fields
- **THEN** all three are present on the parsed `DatRom`

#### Scenario: ROM with CRC only
- **WHEN** a ROM entry has only a crc field (no md5 or sha1)
- **THEN** `rom.crc` is populated, `rom.md5` and `rom.sha1` are `undefined`

#### Scenario: ROM with no checksums
- **WHEN** a ROM entry has only name and size (no checksum fields)
- **THEN** all checksum fields are `undefined`

### Requirement: Handle serial field for disc-based systems
The system SHALL extract the `serial` field from ROM entries when present.

#### Scenario: ROM with serial field
- **WHEN** a ROM entry contains a `serial` field (e.g., disc-based systems like PS1)
- **THEN** `rom.serial` contains the serial string value

#### Scenario: ROM without serial field
- **WHEN** a ROM entry does not contain a `serial` field
- **THEN** `rom.serial` is `undefined`

### Requirement: Normalize checksum casing
The system SHALL normalize all checksum values (crc, md5, sha1) to uppercase.

#### Scenario: Mixed-case checksums normalized to uppercase
- **WHEN** a ROM entry has `crc abcd1234` and `sha1 AbCdEf0123456789...`
- **THEN** `rom.crc` is `"ABCD1234"` and `rom.sha1` is `"ABCDEF0123456789..."`

### Requirement: Normalize line endings
The system SHALL normalize `\r\n` line endings to `\n` before parsing.

#### Scenario: Windows line endings
- **WHEN** `parseDat(content)` is called with content using `\r\n` line endings
- **THEN** the parse succeeds identically to the same content with `\n` endings

### Requirement: Parse size as number
The system SHALL parse the `size` field on ROM entries as a JavaScript `number`.

#### Scenario: Size field parsed as number
- **WHEN** a ROM entry has `size 1048576`
- **THEN** `rom.size` is the number `1048576`, not the string `"1048576"`

### Requirement: Ignore unknown fields silently
The system SHALL ignore fields it does not recognize without returning an error.

#### Scenario: Unknown field in game block
- **WHEN** a game block contains an unrecognized field (e.g., `status baddump`)
- **THEN** the field is silently ignored and the game is parsed successfully

### Requirement: Handle quoted strings with parentheses
The system SHALL correctly parse quoted string values that contain parentheses.

#### Scenario: Title with parentheses
- **WHEN** a game or ROM name contains parentheses: `name "Tetris (World) (Rev 1)"`
- **THEN** the full quoted value `"Tetris (World) (Rev 1)"` is parsed as a single string, not split on parentheses

### Requirement: No side effects
The `parseDat()` function SHALL NOT write to disk, modify global state, or perform any operation beyond string processing.

#### Scenario: Function is pure
- **WHEN** `parseDat(content)` is called
- **THEN** no files are created or modified and no global state is changed
