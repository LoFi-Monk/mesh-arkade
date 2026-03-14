# Proposal: Transition to Hyperbee + Dynamic Crawling

## Goal

Resolve the blocking `bare-sqlite` dependency issue by transitioning the local metadata store to **Hyperbee** and replacing the hardcoded system list with dynamic DAT crawling from GitHub.

## Why

- **Fix Blocking Errors**: The `bare-sqlite` package used by the initial implementation does not exist on the public npm registry, causing runtime `MODULE_NOT_FOUND` errors.
- **P2P Alignment**: Hyperbee is the native, append-only B-tree KV store for the Holepunch/Pear ecosystem. It provides direct support for P2P replication, aligning with the project's long-term "Sanctity Flow" goals.
- **Curation Scalability**: The current hardcoded list of systems limit the project. Dynamic crawling of the `libretro/libretro-database` repository allows for automatic support of all current and future systems.

## What

- **Storage Layer**: Migrate `src/core/database.ts` from SQLite to Hyperbee.
- **Dynamic Crawling**: Implement a discovery service in `src/core/curation.ts` that fetches the list of available systems directly from GitHub's DAT mirror.
- **P2P Readiness**: Ensure the Hyperbee instance is initialized correctly within the Pear `app.storage` path and ready for future swarm replication.
- **Test Integrity**: Replace test mocks with real memory-based Hypercore/Hyperbee instances to ensure reliable verification.
