# Design: Curator Library Mount Manager

## Context

The Curator system manage local game library directories (mounts). To maintain its decentralized and portable nature, it follows a "Cellular Library" model where indexing data is co-located with the media.

## Architecture

### 1. Curator Manager (`src/core/curator.ts`)
A central singleton (or managed instance within `CoreHub`) that handles the lifecycle of library mounts.
- **State Management**: Maintains an in-memory list of active mounts, synchronized with `mounts.json`.
- **Mount Logic**: `CuratorManager.mount(path?)`
  - Validates if the path is a directory.
  - Checks for an existing `.mesh-hub` index.
  - Initializes a new Hypercore log if missing.
- **Unmount Logic**: Gracefully closes Hypercores and removes the path from active state.

### 2. Cellular Indexing (`.mesh-hub/`)
Each mounted directory contains a `.mesh-hub/` subdirectory.
- **Hypercore**: An append-only log storing file metadata (name, size, hash, region, system).
- **Discovery**: The `Curator` scans for known file extensions (.zip, .sfc, .iso, etc.) and updates the local Hypercore index.

### 3. CLI Interaction (`index.js`)
The `bootBare` mode in `index.js` will be updated with:
- `mount <path>`: Command to add a new library.
- `unmount <path>`: Command to remove a library.
- `list-mounts`: Display all configured libraries.
- **Interactive Wizard**: A `readline`-based flow for "First Run" scenarios to guide users in adding their first library.

### 4. JSON-RPC Integration
`CoreHub` registers `curator:*` namespace methods to allow future UI components to interact with the library manager.


## Testability

The system is designed for high testability:
- **Environment Mocking**: The persistence layer uses `pear-electron` storage, which will be mocked in tests to avoid filesystem side effects during CI.
- **Dependency Injection**: The `Curator` manager will be initialized within the `Hub` to allow for easy mocking of library discovery logic.
- **TDD Workflow**: Every feature (mount, unmount, list) will have a corresponding test case in `src/core/__tests__/curator.test.ts` before implementation.

## Risks / Trade-offs

- **Filesystem Permissions**: The app needs write access to the library directories to create `.mesh-hub`.
- **Index Latency**: Large libraries may take time to index initially. We use Hypercore's append-only nature to make updates efficient.
