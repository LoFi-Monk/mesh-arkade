# Proposal: Curator Library Mount Manager

## Why

This feature is the foundation of MeshARKade's decentralized library system. It allows users to bring their existing ROM collections into the ecosystem without moving them, while ensuring metadata remains portable and cryptographically verifiable.


## Motivation

The goal is to implement the "Cellular Library" logic, a core part of the MeshARKade ecosystem. This allows the system to discover retro game ROMs in arbitrary local directories ("mounts") and index them with decentralized metadata that travels with the media. This ensures that a library can be easily shared or moved while maintaining its archival integrity and provenance.

## Impact

- **Core Engine**: Introduces the `Curator` manager for directory lifecycle and indexing.
- **Persistence**: Adds `mounts.json` to the application storage for tracking user-defined library paths.
- **Metadata**: Creates `.mesh-hub/` directories within mounted paths to store Hypercore-backed file indexes.
- **CLI/API**: Exposes new JSON-RPC methods and interactive CLI commands for mounting, unmounting, and listing libraries.
## Implementation Strategy

We will follow a **Test-Driven Development (TDD)** approach. Opencode is required to write unit and integration tests for each component before implementing the logic, ensuring stability in the core engine.
