## Context

Mesh-ARKade currently provides a read-only game catalog parsed from DAT files. To move toward a functional P2P preservation platform, we need to implement the "User Collection" layer. This layer bridges the gap between a user's local ROM files and the decentralized swarm.

Current constraints:
- **Bare Runtime**: Must remain compatible with Pear's `Bare` runtime (no DOM, Node-compatible FS).
- **Identity Isolation**: Collections must be tied to the user's cryptographic identity (CORE-008) and stored in a way that is portable but secure.
- **Zero Duplication**: We cannot afford to duplicate large ROM sets. Implementation must use zero-copy mounting.

## Goals / Non-Goals

**Goals:**
- Implement a persistent collection registry in the App Root.
- Create a portable collection marker (`.mesh-arkade/`) for drive-agnostic discovery.
- Build an automated scanner that identifies ROMs by hash and verifies them against the Hyperbee catalog.
- Integrate the "Virtual Mirror" using Pear's `Hyperdrive` and `Localdrive` for zero-copy seeding.
- Expose collection management through `ArkiveService`.

**Non-Goals:**
- **Manual Metadata Editing**: Users cannot manually override metadata in this phase (ADR-0014: hashes are truth).
- **Multi-system Simultaneous Scan**: This phase focuses on single-system or sequential directory scanning.
- **Cloud Backup**: Collections are local-first; cloud/P2P backup of the *manifest* is deferred.

## Decisions

### 1. The ".mesh-arkade" Standard
**Decision**: Use a hidden `.mesh-arkade/` folder at the root of every user collection.
**Rationale**: Similar to `.git` or `.obsidian`, this makes the collection self-describing. If a user moves an external drive from `D:` to `E:`, Mesh-ARKade can rediscover the collection by its UUID inside `.mesh-arkade/collection.json` rather than relying on brittle absolute paths.
**Alternatives**: Centralized database of absolute paths (fails on drive letter changes).

### 2. Virtual Mirror (Hyperdrive + Localdrive)
**Decision**: Use `Hyperdrive` with a `Localdrive` storage backend for seeding.
**Rationale**: Pear's `Localdrive` allows a `Hyperdrive` to read directly from a local filesystem path without copying the data into a internal storage block. This provides zero-copy seeding and built-in Merkle tree verification.
**Alternatives**: Copying ROMs into a managed internal folder (wastes disk space).

### 3. Collection Storage (Identity Hyperbee)
**Decision**: Store collection metadata (registry and manifests) in a sub-bee of the user's Identity Corestore.
**Rationale**: This isolates the user's personal library from the global game catalog and ensures that if they move their `Pear.config.storage`, their collections (and verification status) move with them.
**Alternatives**: Global Hyperbee (mixes public and private data).

### 4. Manifest as Human-Readable JSON
**Decision**: In addition to Hyperbee storage, write a `manifest.json` inside `.mesh-arkade/`.
**Rationale**: Follows the "Inspectable State" philosophy (ADR-0016). Users can see exactly what the app thinks is in their folder without needing a database viewer.
**Alternatives**: Binary-only database (harder to debug/verify).

## Risks / Trade-offs

- **[Risk] Merkle Mismatch**: If a user modifies a ROM file on disk after it's been mirrored, the Hyperdrive read will fail.
  - **Mitigation**: `ArkiveService` will catch Merkle errors and trigger a "Self-Healing Scan" to re-verify the specific file and update the manifest.
- **[Risk] I/O Performance**: Hashing large collections (e.g., full No-Intro sets) can take time.
  - **Mitigation**: Implementation will use a non-blocking directory walker and provide progress feedback via event emitters.
- **[Risk] Drive Disconnection**: A user might start the app without their ROM drive plugged in.
  - **Mitigation**: `ArkiveService` will mark missing collections as `disconnected` rather than deleting them, allowing for easy reconnection.
