## ADDED Requirements

### Requirement: Fetch and merge supplementary DATs by CRC
The system SHALL provide a merge pipeline that fetches the main NES DAT and 5 supplementary metadata DATs (developer, genre, releaseyear, releasemonth, publisher) from the libretro-database repository. The pipeline SHALL merge supplementary fields onto the main DAT entries using uppercase-normalized CRC as the join key.

#### Scenario: Merge developer metadata onto main DAT entry
- **WHEN** the main DAT contains a game with ROM CRC "3A3B5B05" and the developer DAT contains a game with comment matching CRC "3A3B5B05" and ROM name "Nintendo"
- **THEN** the merged entry has `developer: "Nintendo"`

#### Scenario: Merge all 5 supplementary fields
- **WHEN** all 5 supplementary DATs contain entries matching a CRC in the main DAT
- **THEN** the merged entry has `developer`, `genre`, `releaseyear`, `releasemonth`, and `publisher` populated

#### Scenario: Supplementary DAT missing entry for a CRC
- **WHEN** the developer DAT has no entry matching a CRC in the main DAT
- **THEN** the merged entry has `developer: undefined` (field is simply absent)

#### Scenario: Supplementary DAT fetch fails
- **WHEN** one of the 5 supplementary DAT fetches returns an error (404 or network error)
- **THEN** the merge pipeline continues with remaining DATs and logs a warning
- **THEN** the affected enrichment field is `undefined` on all entries

### Requirement: Supplementary DAT base paths
The merge pipeline SHALL fetch supplementary DATs using the following `basePath` values: `metadat/developer`, `metadat/genre`, `metadat/releaseyear`, `metadat/releasemonth`, `metadat/publisher`.

#### Scenario: Correct URLs for supplementary DATs
- **WHEN** the merge pipeline fetches the developer DAT for NES
- **THEN** it calls `fetchDat("Nintendo - Nintendo Entertainment System", { basePath: "metadat/developer" })`

### Requirement: Parse region from game name
The system SHALL extract region information from parenthetical tokens in the game name using a predefined allowlist. The allowlist SHALL include at minimum: USA, Europe, Japan, World, Australia, Brazil, Canada, China, France, Germany, Hong Kong, Italy, Korea, Netherlands, Russia, Spain, Sweden, Taiwan, UK. Multi-region entries (e.g., `(USA, Europe)`) SHALL be stored as a comma-separated string. Games with no recognized region token SHALL have `region: null`.

#### Scenario: Single region extracted
- **WHEN** the game name is "Super Mario Bros. (USA)"
- **THEN** `region` is `"USA"`

#### Scenario: Multi-region extracted
- **WHEN** the game name is "Tetris (USA, Europe)"
- **THEN** `region` is `"USA, Europe"`

#### Scenario: No region token found
- **WHEN** the game name is "Homebrew Game (Unl)"
- **THEN** `region` is `null`

#### Scenario: Region token among other parenthetical content
- **WHEN** the game name is "Zelda (USA) (Rev A)"
- **THEN** `region` is `"USA"` (non-region tokens like "Rev A" are ignored)

### Requirement: CRC normalization in merge pipeline
The merge pipeline SHALL normalize all CRC values to uppercase before joining main and supplementary DAT entries.

#### Scenario: Mixed-case CRC values are matched
- **WHEN** the main DAT has CRC "3a3b5b05" and the developer DAT has CRC "3A3B5B05"
- **THEN** the entries are matched and merged correctly

### Requirement: Write merged entries to Hyperbee
After merging, the pipeline SHALL store all enriched entries using `storeDat` (or equivalent), including the new enrichment fields. The name index SHALL also be populated during this step.

#### Scenario: Merged entries stored with enrichment
- **WHEN** the merge pipeline completes for NES
- **THEN** each stored `StoredRomEntry` includes base fields (gameName, romName, size, hashes) plus any available enrichment fields (developer, genre, releaseyear, releasemonth, publisher, region)

#### Scenario: Name index populated from merged entries
- **WHEN** the merge pipeline completes for NES
- **THEN** the name index contains entries for all games in the merged dataset
