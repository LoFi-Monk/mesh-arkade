# Agent Documentation Reference

This file is a navigation guide for AI agents working on Mesh ARKade.
Pear/Holepunch is niche and fast-moving — do not rely on training data.
Always consult these sources first.

---

## Primary Sources

| Source | URL | Purpose |
|--------|-----|---------|
| Holepunch Org | https://github.com/holepunchto | All official repos — source of truth |
| Pear Docs | https://github.com/holepunchto/pear-docs | Official Pear documentation |

---

## Pear Docs Structure

All docs live at `https://github.com/holepunchto/pear-docs/blob/main/`

### Reference
- `reference/cli.md` — Pear CLI commands
- `reference/configuration.md` — pear.config.js / package.json fields
- `reference/bare-overview.md` — Bare runtime overview (read this before assuming Node APIs exist)
- `reference/api.md` — Pear runtime API
- `reference/node-compat.md` — What Node APIs are and aren't available in Bare
- `reference/recommended-practices.md`

### Guides
- `guide/getting-started.md`
- `guide/starting-a-pear-terminal-project.md`
- `guide/making-a-pear-terminal-app.md`
- `guide/sharing-a-pear-app.md`
- `guide/releasing-a-pear-app.md`

### How-tos
- `howto/connect-two-peers-by-key-with-hyperdht.md`
- `howto/connect-to-many-peers-by-topic-with-hyperswarm.md`
- `howto/replicate-and-persist-with-hypercore.md`
- `howto/work-with-many-hypercores-using-corestore.md`
- `howto/share-append-only-databases-with-hyperbee.md`
- `howto/create-a-full-peer-to-peer-filesystem-with-hyperdrive.md`

### Building Blocks (P2P core)
- `building-blocks/hypercore.md` — append-only log
- `building-blocks/hyperbee.md` — B-tree DB on Hypercore
- `building-blocks/hyperdrive.md` — P2P filesystem
- `building-blocks/autobase.md` — multi-writer support
- `building-blocks/hyperdht.md` — DHT layer
- `building-blocks/hyperswarm.md` — peer discovery + connections

### Helpers
- `helpers/corestore.md` — manages multiple Hypercores
- `helpers/compact-encoding.md` — binary encoding
- `helpers/protomux.md` — protocol multiplexer
- `helpers/secretstream.md` — encrypted streams
- `helpers/localdrive.md` — local filesystem interface
- `helpers/mirrordrive.md` — sync between drives

---

## Key Repos for Mesh ARKade

These are the repos most likely to be relevant. Check the README in each for current API.

### Runtime
| Repo | URL | Notes |
|------|-----|-------|
| bare | https://github.com/holepunchto/bare | The Bare JS runtime — not Node |
| bare-node | https://github.com/holepunchto/bare-node | Node.js compat layer for Bare |
| pear-runtime | https://github.com/holepunchto/pear-runtime | Pear app runtime |

### P2P Stack
| Repo | URL | Notes |
|------|-----|-------|
| hyperswarm | https://github.com/holepunchto/hyperswarm | Peer discovery + connections |
| hyperdht | https://github.com/holepunchto/hyperdht | DHT implementation |
| hypercore | https://github.com/holepunchto/hypercore | Append-only log |
| hyperbee | https://github.com/holepunchto/hyperbee | P2P key/value DB |
| corestore | https://github.com/holepunchto/corestore | Multi-Hypercore manager |
| autobase | https://github.com/holepunchto/autobase | Multi-writer on Hypercore |
| hyperblobs | https://github.com/holepunchto/hyperblobs | Blob storage on Hypercore |

### Bare Standard Modules
| Repo | URL | Notes |
|------|-----|-------|
| bare-fs | https://github.com/holepunchto/bare-fs | Filesystem (use instead of fs) |
| bare-crypto | https://github.com/holepunchto/bare-crypto | Crypto (use instead of crypto) |
| bare-path | https://github.com/holepunchto/bare-path | Path utils |
| bare-os | https://github.com/holepunchto/bare-os | OS info |
| bare-http1 | https://github.com/holepunchto/bare-http1 | HTTP (if needed) |
| b4a | https://github.com/holepunchto/b4a | Buffer for All — Buffer compat |

### Encoding
| Repo | URL | Notes |
|------|-----|-------|
| compact-encoding | https://github.com/holepunchto/compact-encoding | Binary codec |
| sodium-native | https://github.com/holepunchto/sodium-native | Crypto primitives |

### Testing
| Repo | URL | Notes |
|------|-----|-------|
| brittle | https://github.com/holepunchto/brittle | Test runner — use this, not Vitest |
| bare-cov | https://github.com/holepunchto/bare-cov | Coverage for Bare |

---

## Critical Reminders for Agents

- **Bare is not Node.** Do not use `require('fs')`, `require('crypto')`, or `require('path')` directly. Use Bare equivalents or the runtime abstraction layer in `src/core/runtime.ts`.
- **No DOM.** No `window`, `document`, `localStorage`, or browser globals.
- **No fetch directly.** Use the runtime abstraction.
- **DHT peers are mesh-arkade nodes**, not standard BitTorrent swarms. SHA1 as info_hash is intentional — see ADR-0004.
- When in doubt about a Pear/Bare API, read the repo README before guessing.
