## MODIFIED Requirements

### Requirement: Extract game entries with nested ROM data
The system SHALL extract all `game (...)` blocks and their nested `rom (...)` blocks into `DatGame` entries with `DatRom` arrays. When extracting a game entry, the system SHALL use the `name` field as the game name. If `name` is not present, the system SHALL fall back to the `comment` field. If neither field is present, the game block SHALL be skipped.

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

#### Scenario: Supplementary DAT with comment instead of name
- **WHEN** a game block has no `name` field but has a `comment` field (e.g., supplementary metadata DATs from libretro `metadat/`)
- **THEN** `game.name` is set to the value of the `comment` field
- **THEN** the game block is parsed successfully with all its ROM data

#### Scenario: Game block with neither name nor comment
- **WHEN** a game block has no `name` field and no `comment` field
- **THEN** the game block is skipped (not included in the parsed `DatFile.games` array)
