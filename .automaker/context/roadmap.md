# Mesh ARKade — Roadmap & Carry-Forward Items

## Milestone Status

| Milestone | Status |
|-----------|--------|
| 00 — Production Workflow & CI | ✅ Complete |
| 01 — React UI & Branding Foundation | ⏸ Paused (CLI-first pivot) |
| 02 — Core Engine (Headless/Bare) | ✅ Complete |
| 03 — Curator Mount Manager | ✅ Complete |
| 04 — DAT Bootstrap & Curation | ✅ Complete |
| 04a — CLI Layer Extraction | ✅ Complete |
| 04b — Centralize Runtime Utilities | ✅ Complete |
| 05 — P2P Fetch (Triple-Layer) | ✅ Complete |
| 06 — BitTorrent Wire Protocol | ✅ Complete (PR #16 merged 2026-03-18) |
| 06a — BitTorrent Modularization + Docs | 🚀 In Progress |
| N — Normalization & TorrentZip | 📋 Backlog |
| N — Emulation Layer | 📋 Backlog (Phase 3+) |

---

## Active Backlog

| Card | Description |
|------|-------------|
| Refactor bittorrent.ts into focused modules | Split 1257-line file into 6 modules + write ADR and architectural doc alongside |
| Fix Hub Resource Leak | `stop()` doesn't close Hyperbee/Corestore |
| Fix System Name Matching Bug | `getSystemDefinition` uses `.includes()` — nes matches snes |
| Extract CLI Command Handlers | Move handlers out of `index.js` into proper CLI layer |
| End-to-End Integration Test Harness | Real DHT lookup + peer connect + piece download test |

---

## Carry-Forward (Still Open)

### docs/architecture.md — Needs Full Rewrite
File is stale — missing P2P fetch layer, BitTorrent DHT, FetchManager, trust layer, and CLI command structure. C4 diagram has inaccuracies (HTTP/WebSocket ref). Defer until after bittorrent modularization card lands — the new architectural doc from that card will be the primary source to pull from.

### Trust & Security Hardening (future milestone)
- `12.4` — First-run DAT bootstrap: route through `fetchVerifiedDat`, reject on hash mismatch
- `12.5` — Content-addressed pinning: announce verified SHA1 on Hyperswarm so peers can retrieve from swarm

---

## Strategic Notes

- **CLI-first always**: If it doesn't work headless, it doesn't ship. GUI wraps CLI, never the reverse.
- **No emulation in scope** until Phase 3+. Focus is preservation infrastructure.
- **Myrient shutdown**: 2026-03-31. P2P layers are critical infrastructure — prioritize anything that enables ROM retrieval.
- **Agents = humans**: All CLI commands must support `--json` for machine-parseable output.
- **Custom BitTorrent protocol**: SHA1-as-info_hash is intentional. Our DHT peers are mesh-arkade nodes, not standard BT swarms. See `docs/adr/` and AGENTS.md Intentional Design Decisions.
