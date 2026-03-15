# Specification: Curation Service

## Interface: `CurationManager`

The `CurationManager` is responsible for the lifecycle of technical game metadata. It translates external "Truth" (DAT files) into local "Searchable Context" (Wishlist).

### Methods

#### `seedSystem(system: string): Promise<SeedResult>`
- **Intent**: Download and index the official DAT for a given system.
- **Constraints**: 
  - Must use the Libretro GitHub mirror URL.
  - Must parse XML and upsert records into SQLite.
  - Must not duplicate entries (key on SHA1).

#### `searchWishlist(query: string): Promise<GameEntry[]>`
- **Intent**: Query the local SQLite database for matching titles.
- **Guarantees**:
  - Returns matches sorted by relevance (title match).
  - Includes SHA1, CRC, and Region information.

#### `getTruth(sha1: string): Promise<GameEntry | null>`
- **Intent**: Provide a single point of truth for file verification.
- **Guarantees**:
  - Returns the full DAT record for a validated SHA1.

### Data Schemas

#### `GameEntry`
```typescript
interface GameEntry {
  title: string;
  system: string;
  sha1: string;
  crc?: string;
  md5?: string;
  region?: string;
}
```

## CLI Interface

### `mesh init --seed <system>`
- **Behavior**: Calls `CurationManager.seedSystem()`.
- **Output**: ASCII Progress bar during indexing followed by a summary: "Seeded 3,421 games for NES."

### `mesh search <query>`
- **Behavior**: Calls `CurationManager.searchWishlist()`.
- **Output**: A table showing `Title`, `Region`, and `Status` (Wishlist/Staged/Sanctified).
