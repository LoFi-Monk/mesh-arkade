# ADR 0002: Hyperbee for Museum-Grade Metadata Storage

**Status**: Accepted  
**Date**: 2026-03-14

## Context and Problem Statement
The project requires a storage engine for game metadata (DAT files), achievement tracking, and library indexing. The initial proposal included SQLite (via `bare-sqlite`), but we encountered platform-specific compilation issues with native C++ addons in the Bare runtime on Windows.

## Considered Options
1.  **SQLite (`bare-sqlite`)**: SQL-based, powerful, but relies on complex native bindings.
2.  **JSON / Flat Files**: Simple, but slow and doesn't scale to 5,000+ records with search requirements.
3.  **Hyperbee**: Part of the Holepunch/Pear ecosystem. Append-only B-tree over Hypercore.

## Decision
We chose **Hyperbee** as the primary storage layer.

## Rationale
- **Ecosystem Alignment**: Since `mesh-arkade` is built on the Pear runtime, Hyperbee (developed by Holepunch) offers the best integration and long-term P2P portability.
- **Bare-Friendly**: Designed for high performance in the Bare runtime.
- **Searchable**: Provides efficient indexing and streaming, satisfying the "Dynamic Search" requirement for large game libraries.
- **Portable**: Allows us to eventually share databases over the Hyper swarm without central servers.

## Consequences
- **Positive**: Native P2P integration; fast searching; no SQLite native binding issues.
- **Negative**: Requires learning the B-tree/Namespacing pattern rather than relational SQL.
