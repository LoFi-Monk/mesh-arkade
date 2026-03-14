# Design: Curation Milestone 1 - The Bootstrap

## Overview
This design covers the implementation of the "Truth" acquisition layer. The system will fetch, parse, and store game metadata from official No-Intro/Redump DAT files to enable offline discovery and P2P verification.

## Architecture

### 1. Curation Service (`CurationManager`)
A new service in `src/core/curation.ts` that handles:
- **Seeding**: Downloading and indexing DATs.
- **Searching**: Querying the local wishlist.
- **Validation**: Providing the hash "truth" to other services (like `FetchManager`).

### 2. Storage Layer
- **Wishlist Database**: A local SQLite database (`~/.mesh-arkade/wishlist.db`) used for performance and relational queries (e.g., finding all games for a system).
- **Bare SQLite**: We will integrate `bare-sqlite` for native, low-overhead database access in the Bare runtime.

### 3. DAT Fetching & Parsing
- **URL Strategy**: Use the Libretro GitHub mirror as the primary source for No-Intro DATs.
- **Parsing**: A dedicated `DatParser` utility that handles the CLRMamePro XML format. 
  - *Risk*: XML can be heavy.
  - *Mitigation*: Use a streaming parser if available, or a robust regex-based approach for memory efficiency during indexing.

## Data Model

### `systems` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | STRING (PK) | System identifier (e.g., `nes`, `snes`). |
| `title` | STRING | Friendly name (e.g., `Nintendo Entertainment System`). |
| `dat_url` | STRING | Source URL for updates. |
| `last_updated` | TIMESTAMP | Last time the DAT was synced. |

### `wishlist` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Auto-increment ID. |
| `system_id` | STRING (FK) | Reference to `systems`. |
| `title` | STRING | Game title. |
| `sha1` | STRING (INDEX) | The hash used for P2P discovery. |
| `crc` | STRING | Legacy verification hash. |
| `md5` | STRING | Alternative verification hash. |
| `region` | STRING | Extracted from the title or XML metadata. |

## CLI Commands
- `mesh init --seed nes`: Triggers fetch -> parse -> store.
- `mesh search <query>`: List matches from the `wishlist` table based on the title.

## Trade-offs
- **SQLite vs Flat JSON**: SQLite allows for much larger datasets (10,000+ entries) without blocking the main thread for JSON parsing.
- **NAPI-RS**: We might use a Rust-based parser later if the JS parser is too slow for "Complete" sets.
