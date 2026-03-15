# Mesh-Arkade Project Roadmap (Curator Overhaul)

**Repository:** [LoFi-Monk/mesh-arkade](https://github.com/LoFi-Monk/mesh-arkade)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context.

---

## **[NEXT] Carry-Forward from Milestone-05**

**Status**: NEXT 🚀

These items were deferred from milestone-05 and must be addressed before or during milestone-06:

### Fetch Layer Unit Tests (test coverage debt)
- `5.3` — Hyperswarm layer: mock peer success + timeout cases
- `6.3` — IPFS layer: map hit + 200, map miss, gateway error
- `7.4` — BitTorrent layer: mock DHT success + timeout cases
- `8.4` — FetchManager: Hyperswarm success, fallback to IPFS, all-fail aggregation
- `9.7` — `handleFetch` CLI command: valid SHA1 + library, invalid SHA1, no library mounted
- `12.6` — `fetchVerifiedDat`: hash match (accept), hash mismatch (reject), network error

### BitTorrent DHT Spike (blocker for milestone-06 BitTorrent implementation)
- `7.1` — Spike `bittorrent-dht` in a Bare process to confirm DHT lookup works with SHA1 as infohash

### Trust & Security Hardening (scoped to a future trust milestone)
- `12.4` — First-run DAT bootstrap: route through `fetchVerifiedDat`, reject on hash mismatch
- `12.5` — Content-addressed pinning: announce verified SHA1 on Hyperswarm so peers can retrieve from swarm
- `12.7` — Document trust model in `openspec/changes/milestone-05/specs/dat-trust/spec.md`

---

## **[00] Production Contribution Workflow (Safety & CI)**

**Status**: Completed ✓
**Context**: Implement a production-grade safety net. Setting up GitHub Actions, branch protection rules (PRs required, checks must pass, threads resolved), and AI-led review integration to ensure the `main` branch is a fortress of quality.

---

## **[01] React UI & Branding Foundation**

**Status**: Backlog (Paused for CLI)
**Context**: Implement the React-based branding system.

---

## **[02] The Core Engine (Headless/Bare)**

**Status**: Completed ✓
**Context**: Establish the "Hub" architecture. Refactor `branding.ts` into `src/core` for shared identity. Implement a dual-mode `index.js` that detects Bare (CLI) vs. Electron (GUI). Create a high-quality 8-bit ASCII terminal splash screen and integrate `pear-terminal` for a persistent CLI status footer.

---

## **[03] The Curator CLI (Mount Manager)**

**Status**: Completed ✓
**Context**: Implement the "Cellular Library" logic. Allow the engine to `mount` external directories, detect existing ROMs, and `sanctify` paths by creating a local Hypercore metadata index (`.mesh-hub`).

---

## **[04] Curation Bootstrap (DAT & Hyperbee)**

**Status**: Completed ✓ (PR #3 merged 2026-03-14)
**Context**: Bootstrap flow that fetches No-Intro DATs from Libretro GitHub, parses CLRMamePro format, and populates a local Hyperbee-backed wishlist. CLI commands: `systems`, `init --seed=<id>`, `search <query>`, `search --system=<id>`.

---

## **[04a] Refactor Phase 1: Extract CLI Layer**

**Status**: Completed ✓ (PR #5 merged 2026-03-15)
**Context**: `index.js` is a 789-line God File handling CLI parsing, command dispatch, REPL, GUI boot, help rendering, first-run wizard, and output formatting — with zero tests. This is the highest-risk, hardest-to-maintain file in the project. Extracting the CLI layer enables independent command testing and clean boundaries for milestone-05's new `fetch` command.

### **Scope:**

```
index.js (789 → ~100 lines: boot logic + REPL only)

src/cli/
  commands/mount.ts      ← from handleMount()
  commands/unmount.ts    ← from handleUnmount()
  commands/search.ts     ← from handleSearch()
  commands/systems.ts    ← from handleSystems()
  commands/init.ts       ← from handleInit()
  commands/reset.ts      ← from handleReset()
  commands/status.ts     ← from showStatus()
  formatter.ts           ← JSON vs human-readable output logic
  wizard.ts              ← first-run wizard
  parser.ts              ← arg parsing (parseArgs)
```

### **Principles:**

- Each command is a single file with a single exported handler function
- Formatter abstracts JSON vs human output — commands don't know about `--json`
- `index.js` becomes a thin shell: detect environment → boot → REPL loop → dispatch to `src/cli/commands/`
- Use `environment.ts` instead of inline detection in `index.js`
- Every extracted command gets its own test file

### **Deferred bug fixes to include:**

- Hub `stop()` should close Hyperbee/Corestore on shutdown
- `getSystemDefinition` loose `.includes()` matching (`nes` matches `snes`)
- Remove dead `askQuestion` function
- Wire up or remove unused `drawProgressBar`

---

## **[04b] Refactor Phase 2: Centralize Runtime Utilities**

**Status**: NEXT 🚀 (follows 04a)
**Context**: Three core modules (`database.ts`, `curator.ts`, `storage.ts`) duplicate identical Bare/Node conditional import logic for `fs`, `path`, and `os`. Storage path resolution is duplicated between `hub.ts` and `storage.ts`. This violates DRY and makes runtime changes error-prone.

### **Scope:**

```
src/core/runtime.ts    ← unified Bare/Node module loader (fs, path, os, fetch)
src/core/paths.ts      ← single source of truth for storage path resolution
```

### **Principles:**

- `runtime.ts` exports lazy-initialized `getFs()`, `getPath()`, `getOs()`, `getFetch()`
- Each returns the Bare or Node version depending on runtime — called once, cached
- `paths.ts` owns all `Pear.app.storage` resolution — `hub.ts` and `storage.ts` call it instead of duplicating
- Remove all inline `if (typeof Bare !== "undefined")` import blocks from consumer modules
- Extract DAT parsing from `curation.ts` into `src/core/dat-parser.ts` (~90 lines)
- Standardize on factory pattern across all modules (align curator.ts and curation.ts with hub.ts singleton)

---

## **[05] Curation Milestone 2: The Multi-Layer Recovery (P2P Fetch)**

**Status**: Completed ✓ (PR #9 merged 2026-03-15)
**Context**: Implementing the Triple-Layer Discovery (Pear Swarm -> Torrent -> IPFS) to allow "From Zero" library creation.

### **Proposed Implementation Prompt:**

> /opsx-propose "Implement Curation Milestone 2: P2P Multi-Layer Recovery (`milestone-05`)
>
> **Objective**: Build the `mesh fetch` command with P2P fallbacks.
>
> **Requirements**:
>
> 1. **Pear Swarm Layer**: Topic-based discovery on Hyperswarm using SHA1.
> 2. **IPFS Fallback**: Use the 'Museum Map' to resolve SHA1 to CID and fetch via IPFS.
> 3. **Torrent Fallback**: Use SHA1 as an infohash for public DHT lookup.
> 4. **Fetch Manager**: Progress-bar driven fetcher that streams bytes to the `stage/` directory of a mounted library."

---

## **[06] Curation Milestone 3: Normalization & Identity (TorrentZip)**

**Status**: Backlog
**Context**: Ensuring bit-perfect identity across all peers using Rust-based normalization and header stripping.

### **Proposed Implementation Prompt:**

> /opsx-propose "Implement Curation Milestone 3: Normalization & TorrentZip (`milestone-06`)
>
> **Objective**: Implement the `mesh refine` command with high-performance Rust logic.
>
> **Requirements**:
>
> 1. **Rust NAPI-RS Module**: Create a native module for header stripping (iNES/SMC) and T0Z (TorrentZip) compression.
> 2. **Refine Logic**: Automatically strip headers from Stage/ files and re-pack to canonical ZIP.
> 3. **Sanctification**: Final verification against the DAT. On success, move to `Active/` and update the local `.mesh-hub` Hypercore.
> 4. **Broadcasting**: Announce the new SHA1 on all 3 P2P protocols simultaneously."

---

## **[07] The Preservation Deck (Web/PWA Bridge)**

**Status**: Backlog (Delayed for CLI)
**Context**: Serving the UI over HTTP for remote curators.

---

## **[08] Curator Tools: Exhibits & Social Archival**

**Status**: Backlog

---

## **[09] The Arcade View: Gamepad & Ten-Foot UI**

**Status**: Backlog

---

## **[10] The Living Identity: Dynamic Tagline Engine**

**Status**: Completed ✓

---

## **[11] The Background Seeder: Tray & Startup Logic**

**Status**: Backlog

# Decisions (ADR)

- [ADR 0001: Record Architecture Decisions](file:///c:/ag-workspace/mesh-arkade/.agent/adr/0001-adr-standard.md)
- [ADR 0002: Hyperbee for Metadata Storage](file:///c:/ag-workspace/mesh-arkade/.agent/adr/0002-hyperbee-metadata-storage.md)
