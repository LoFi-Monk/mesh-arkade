# Design: Milestone 04 - Hyperbee + Dynamic Crawling

## Overview

This design replaces the traditional relational database (SQLite) with a P2P-native B-tree (Hyperbee) and implements a dynamic discovery system for DAT metadata using the GitHub API.

## Architecture

### 1. Storage Layer (Hyperbee)
- **Runtime**: Bare (High-level wrapper for low-level storage).
- **Corestore**: Management of the underlying Hypercore.
- **Hyperbee**: Provides the KV API with sorted keys and batch operations.
- **Encoding**: 
  - Keys: `utf-8`
  - Values: `json`

### 2. Namespacing
Hyperbee will use sub-database namespaces to keep data isolated:
- `systems`: Stores system metadata (id, title, datUrl, lastUpdated).
- `wishlist`: Stores game entries (sha1/crc/md5 mapping to title/system).

### 3. Dynamic Crawler (DAT Discovery)
- **Source**: `https://api.github.com/repos/libretro/libretro-database/contents/dat`
- **Logic**:
  - Fetch the file list from the GitHub API.
  - Filter for `.dat` or `.xml` files.
  - Map the filenames to system IDs (e.g., `Nintendo - Nintendo Entertainment System.dat` -> `nes`).
- **Performance**: Use conditional requests (ETags) if needed to avoid rate limiting during frequent `mesh init` calls.

### 4. Data Model

#### `systems` Key
- Key: `system:<id>`
- Value: `{"id": "nes", "title": "Nintendo - Nintendo Entertainment System", "datUrl": "...", "lastUpdated": "..."}`

#### `wishlist` Key
- Key: `game:<sha1>:<systemId>`
- Value: `{"title": "Metroid", "sha1": "...", "crc": "...", "system_id": "nes"}`
- Indexing: Hyperbee already provides range queries. We can search by SHA1 instantly by using it as a key prefix or suffix.

## Trade-offs

- **SQL vs KV**: We lose complex SQL joins, but gain infinite scalability and P2P syncing (Hypercore is the transport).
- **GitHub API Limits**: Using the public API for crawling may hit rate limits.
  - *Mitigation*: The CLI will cache the system list for 24 hours.

## Technical Tasks (Conceptual)
1. Initialize Hyperbee in `database.ts`.
2. Implement `CurationManager.fetchSystems()` to query GitHub.
3. Update `seedSystem` to use Hyperbee batching for game inserts.
4. Implement `searchWishlist` utilizing Hyperbee ReadStreams.
