# Mesh ARKade Architecture

## C4 Context Diagram

```mermaid
C4Context
  title Mesh ARKade System Context Diagram

  Person(user, "User", "A retro game enthusiast who manages ROM libraries")
  System_Boundary(arkade, "Mesh ARKade") {
    Container(bare, "Bare Engine", "Node.js CLI", "Headless terminal interface for local development and scripting")
    Container(exhibit, "Exhibit (Electron)", "React + Electron", "Graphical UI for end users")
    ContainerDb(storage, "Storage", "JSON files", "Persists mount registry and metadata")
    ContainerDb(meshHub, ".mesh-hub", "Directory", "Per-library metadata directory for indexing")
  }
  System_Ext(pear, "Pear Runtime", "P2P runtime for decentralized apps")
  System_Ext(swarm, "Peer Network", "Hyperswarm", "Distributed discovery and data sync")

  Rel(user, bare, "Uses via CLI commands", "stdin/stdout")
  Rel(user, exhibit, "Interacts with GUI", "HTTP/WebSocket")
  Rel(bare, storage, "Reads/writes mounts.json", "fs/promises")
  Rel(bare, meshHub, "Creates .mesh-hub dirs", "fs/promises")
  Rel(exhibit, pear, "Powered by", "Pear Electron")
  Rel(exhibit, bare, "Falls back to in dev mode", "import")
  Rel(exhibit, storage, "Reads/writes via IPC", "JSON-RPC")
  Rel(bare, pear, "Optional: uses for storage", "Pear.app.storage")
  Rel(pear, swarm, "Announces/discovers", "Hyperswarm DHT")
```

## Component Overview

### Bare Engine (index.js)

The headless CLI component that runs in terminal mode. Provides:

- Interactive REPL for mount/unmount/list commands
- JSON mode for scripting integration
- First-run wizard for library setup

### Exhibit (Electron)

The graphical UI component powered by Pear Electron:

- React-based user interface
- Bridge communication with Core Hub
- Fallback to Bare Engine in development mode

### Storage Layer

- **mounts.json**: Global registry of mounted libraries
- **.mesh-hub/**: Per-library metadata directory containing indexing data

### Core Hub (hub.ts)

JSON-RPC server that handles:

- `curator:mount` - Register a new library
- `curator:unmount` - Remove a library
- `curator:list` - List all mounts

## Data Flow

1. User issues `mount /path/to/roms` command
2. Bare Engine calls Core Hub JSON-RPC
3. Curator validates path, creates .mesh-hub, counts ROMs
4. Atomic write to mounts.json via mutex-protected transaction
5. Mount info returned to user
