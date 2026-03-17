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
| 06 — BitTorrent Wire Protocol | 🚀 Next |
| N — Normalization & TorrentZip | 📋 Backlog |
| N — Emulation Layer | 📋 Backlog (Phase 3+) |

---

## Carry-Forward from Milestone 05

These items were deferred and must be addressed before or during Milestone 06.

### Test Coverage Debt
- `5.3` — Hyperswarm layer: mock peer success + timeout cases
- `6.3` — IPFS layer: map hit + 200, map miss, gateway error
- `7.4` — BitTorrent layer: mock DHT success + timeout cases
- `8.4` — FetchManager: Hyperswarm success, fallback to IPFS, all-fail aggregation
- `9.7` — `handleFetch` CLI command: valid SHA1 + library, invalid SHA1, no library mounted
- `12.6` — `fetchVerifiedDat`: hash match (accept), hash mismatch (reject), network error

### BitTorrent DHT Spike (blocker for Milestone 06)
- `7.1` — Spike `bittorrent-dht` in a Bare process to confirm DHT lookup works with SHA1 as infohash

### Trust & Security Hardening (future milestone)
- `12.4` — First-run DAT bootstrap: route through `fetchVerifiedDat`, reject on hash mismatch
- `12.5` — Content-addressed pinning: announce verified SHA1 on Hyperswarm so peers can retrieve from swarm

---

## Milestone 06 — BitTorrent Wire Protocol

**Objective**: Implement the BitTorrent wire protocol layer (currently a stub throwing 'not yet implemented'). Enable DHT-based ROM fetching using SHA1 as info hash.

Key requirements:
1. Spike `bittorrent-dht` in Bare process (carry-forward 7.1)
2. Implement `src/fetch/layers/bittorrent.ts` — DHT lookup with SHA1 as infohash
3. Wire into FetchManager as Layer 3 (currently disabled)
4. Full test coverage for the layer

---

## Strategic Notes

- **CLI-first always**: If it doesn't work headless, it doesn't ship. GUI wraps CLI, never the reverse.
- **No emulation in scope** until Phase 3+. Focus is preservation infrastructure.
- **Myrient shutdown**: 2026-03-31. Affects ROM sourcing — P2P layers become more critical after this date.
- **Agents = humans**: All CLI commands must support `--json` for machine-parseable output.
