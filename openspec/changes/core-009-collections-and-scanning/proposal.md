## Why

The current implementation of Mesh-ARKade has a robust data layer for fetching and parsing DAT files, but it lacks a way for users to manage their own ROM collections. To fulfill the vision of a decentralized game preservation platform, users must be able to register their local ROM folders, verify their files against the global catalog, and contribute to the P2P swarm without duplicating data or complex manual configuration.

## What Changes

- **Collection Registry**: Implementation of a persistent registry in the App Root (`~/mesh-arkade/config.json`) to track user-defined collection paths.
- **Portable Markers**: Introduction of the `.mesh-arkade/` hidden folder pattern inside collection roots, making collections self-identifying and portable across different mount points or drive letters.
- **Automated Scanner**: A directory-walking scanner that hashes local files and performs O(1) lookups in the Hyperbee catalog to identify and verify ROMs.
- **Virtual Mirror (Zero-Copy Seeding)**: Integration of Pear's Hyperdrive + Localdrive pattern to logically mount verified ROMs into the P2P swarm directly from their original location on disk.
- **CLI Commands**: New `collection add`, `collection list`, and `collection scan` commands to expose these capabilities to the user.

## Capabilities

### New Capabilities
- `collection-registry`: Management of collection paths, UUIDs, and discovery (connected/disconnected status).
- `collection-scanner`: Logic for directory walking, hashing, and matching files against the Hyperbee catalog.
- `virtual-mirror`: The P2P mounting layer that maps local verified files to Hyperdrive without duplication.

### Modified Capabilities
- `arkive-service`: The service boundary is extended to include collection lifecycle methods (`addCollection`, `listCollections`, `scanCollection`).
- `app-root`: Schema update to include the `collections` registry.

## Impact

- **Storage**: No duplication of ROM files; only small metadata files (`collection.json`, `manifest.json`) and Merkle trees are stored in the App Root/Engine Room.
- **APIs**: `ArkiveService` becomes the primary entry point for all collection-related operations.
- **Identity**: Collections are tied to the user's cryptographic identity (CORE-008).
- **Performance**: Scanning is I/O bound by hashing; subsequent lookups and P2P mounting are O(1) or near-instant.
