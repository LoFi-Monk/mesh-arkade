# Agent Notes

## Status
- **CORE-007 ARKive Service Layer**: Complete. Archived & synced.
- **CORE-008 IdentityService**: Complete. PR #19 merged into `dev`. Archived & synced.
- **CORE-009 Collections & Scanning**: Complete. PR #21 merged into `dev`. Code is finished and verified. Awaiting final user chores before archiving via `/opsx:archive`.

## Next Actions (in order)
1. Complete any remaining user chores (as requested).
2. Run `/opsx:archive` (or `/opsx-archive-change`) to officially archive the CORE-009 OpenSpec artifacts.
3. Investigate the MiNERVA torrent database/blueprints we acquired, and formulate a plan for the next Phase (likely CORE-010 Media Pipeline or CORE-011 Swarm-First Fetching).

## Current Branch & Repo State
- Currently on branch `dev`.
- `dev` — integration branch.
- `main` — receives merges from `dev` at milestone boundaries only.
- Feature branches always PR to `dev`, never `main`.

## Key Decisions

### CORE-009 Collections (Researched 2026-03-31)
- **Identity Isolation**: A user's personal collection is stored in the **Identity Hyperbee**, *not* the global catalog. This isolates personal libraries, ties them to cryptographic identity, and makes them portable.
- **Virtual Mirror**: Verified files are mounted into a local Hyperdrive without duplication. Modifying a mapped file causes the Merkle tree to fail, safely failing the read and triggering a self-healing re-scan.
- **CLI Commands**: Terminal commands will use `mesh-arkade collection <cmd>` (e.g., `mesh-arkade collection add <path>`).

### P2P & External Sources (Researched 2026-04-01)
- **Strictly Pear-Native (ADR-0020)**: We are forgoing Torrents and IPFS entirely. The swarm is pure Hyperdrive.
- **The Genesis Seed**: LoFi acts as the Genesis Seed with a locally downloaded collection. Start small, expand outward.
- **The Data Engine (GitHub Actions)**: We will replicate Myrient's lists via a public GitHub Action pipeline that pulls, preps, and hosts all necessary DATs in one repo.
- **EmulatorJS Metadata**: We will use EmulatorJS metadata (CIDs) to populate the frontend with box art/videos without scraping libretro thumbnails (CORE-010).

### Storage Architecture
- **Engine Room** = Hyperbee in `Pear.config.storage` (hidden, internal, fast O(1) lookups).
- **App Root** = `~/mesh-arkade/` — user-accessible home. Contains only `config.json` (no raw DATs).
- **DATs stored once** — Hyperbee only (ADR-0018).

### Identity & Profile
- **Identity** = `corestore.get({ name: 'profile' }).publicKey`.
- **Local-only for Phase 1** — profile core never joins a Hyperswarm topic.

## Feature Hierarchy

| Epic | Status |
|------|--------|
| CORE-001 Husky Pre-commit | Done |
| CORE-002 Logging & Startup | Done |
| CORE-003 DAT Ingestion | Done (S0–S4, PR #16 + #17) |
| CORE-004 Batch Import | Backlog — skip until ARKive proven |
| CORE-005 Storage & Collections | Deferred — schemas emerge from ARKive data |
| CORE-006 ROM Resolver | Backlog — skip until ARKive proven |
| CORE-007 ARKive Service Layer | Done — PR #18 merged, archived |
| CORE-008 ProfileService / Identity | Done — PR #19 merged, archived |
| CORE-009 Collections & Scanning | Done — PR #21 merged, ready to archive |
| CORE-010 Media Pipeline | Draft — Phase 3, thumbnails + EmulatorJS metadata |
| CORE-011 Swarm-First Fetching | Draft — Phase 4, genesis seed |
| CORE-012 IPFS Fallback | Deprecated (ADR-0020) |

## User's Personal Collection Seed
- Myrient catalog is gone. MiNERVA archive is the new manual fallback source.
- Currently seeding NES (headerless + headered), SNES, GB, GBC, GBA, Game Gear, Neo Geo Pocket/Color, Atari 2600, Atari Lynx, Sega Genesis (No-Intro).
- FBNeo arcade + samples.