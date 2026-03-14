# Proposal: Curation Milestone 1 - The Bootstrap (Milestone-04)

## Objective
Enable the Mesh ARKade CLI to fetch system DAT files (metadata "Truth") and initialize a local 'Wishlist' database. This transforms the CLI from a simple file indexer into a functional curation workbench that understands what games *should* exist in a library.

## Motivation
Currently, Mesh ARKade can only index existing files. To support the "From Zero" user experience, the system needs to know which games belong to a system (e.g., NES) before they are present on disk. Fetching verified DATs from the Libretro database provides a trusted metadata foundation for discovery, verification, and P2P fetching.

## Proposed Changes
- **DAT Fetcher**: Add `mesh init --seed <system>` to pull raw XML DATs from the Libretro GitHub repository.
- **DAT Parser**: Implement a robust parser to extract `title`, `sha1`, `crc`, and `md5` from CLRMamePro XML format.
- **Wishlist Database**: Initialize a local SQLite database (`~/.mesh-arkade/wishlist.db`) to store these entries.
- **CLI Interaction**: Add `mesh search <query>` to allow users to verify if a game is known to the "Truth" table.

## Impact
- **Initial Setup**: Users can move from "no files" to "ready to fetch" in seconds.
- **Data Integrity**: Provides the SHA1 hashes needed for the "Sanctity Flow" verification.
- **Sandbox Ready**: Enables testing at `E:\mesh_arkade_dev` with a clear target list.
