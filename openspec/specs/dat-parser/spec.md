## ADDED Requirements

### Requirement: Format-agnostic DAT parsing
`dat-parser.ts` SHALL export a `parseDat(content: string)` function that detects the DAT format (CLRMamePro or XML) and dispatches to the appropriate parser. It MUST return an array of game records with `name`, `sha1`, `crc`, and `md5` fields.

#### Scenario: CLRMamePro format detection
- **WHEN** `parseDat()` is called with content containing `clrmamepro` header
- **THEN** it delegates to the CLRMamePro parser and returns parsed game records

#### Scenario: XML format detection
- **WHEN** `parseDat()` is called with content containing XML `<game>` or `<machine>` elements
- **THEN** it delegates to the XML parser and returns parsed game records

### Requirement: CLRMamePro parser
`dat-parser.ts` SHALL export a `parseClrmamepro(content: string)` function that extracts game blocks using regex, parsing `name`, `sha1`, `crc`, and `md5` from ROM entries within each block.

#### Scenario: Standard game block
- **WHEN** `parseClrmamepro()` is called with a valid CLRMamePro game block containing a ROM entry with name, sha1, and crc
- **THEN** it returns a record with all fields populated

#### Scenario: Missing hash fields
- **WHEN** a ROM entry lacks an `md5` field
- **THEN** the `md5` field in the returned record is an empty string

### Requirement: XML DAT parser
`dat-parser.ts` SHALL export a `parseDatXml(content: string)` function that extracts game and ROM elements from XML-formatted DAT files.

#### Scenario: Standard XML game element
- **WHEN** `parseDatXml()` is called with valid XML containing `<game>` elements with `<rom>` children
- **THEN** it returns records with name, sha1, crc, and md5 extracted from attributes

### Requirement: Region extraction
`dat-parser.ts` SHALL export an `extractRegion(gameName: string)` function that parses region identifiers from parenthetical suffixes in game titles (e.g., `(USA)`, `(Europe)`, `(Japan)`).

#### Scenario: Known region in title
- **WHEN** `extractRegion("Super Game (USA)")` is called
- **THEN** it returns `"USA"`

#### Scenario: No region in title
- **WHEN** `extractRegion("Super Game")` is called
- **THEN** it returns `"Unknown"`

### Requirement: Pure functions with no runtime coupling
All exported functions in `dat-parser.ts` MUST be pure functions operating on string inputs. The module MUST NOT import `fs`, `path`, `fetch`, or any runtime-dependent module.

#### Scenario: No side effects
- **WHEN** `dat-parser.ts` is analyzed for import statements
- **THEN** it imports no I/O or runtime modules
