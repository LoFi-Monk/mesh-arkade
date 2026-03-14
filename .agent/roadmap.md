# Mesh-Arkade Project Roadmap (Curator Overhaul)

**Repository:** [LoFi-Monk/mesh-arkade](https://github.com/LoFi-Monk/mesh-arkade)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context. 

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

## **[04] Curation Milestone 1: The Bootstrap (DAT & Metadata)**
**Status**: NEXT 🚀
**Context**: Moving from "Indexing" to "Curating". Implement the initial bootstrap flow that fetches No-Intro DATs from GitHub and populates a local "Truth Table" (SQLite) for verification.

### **Next Prompt for Implementation Agent:**
> /opsx-propose "Implement Curation Milestone 1: The Bootstrap (`milestone-04`)
> 
> **Objective**: Enable the CLI to fetch system DATs and initialize the local 'Wishlist' database.
> 
> **Requirements**:
> 1. **DAT Fetcher**: Implement `mesh init --seed <system>` (default: nes). 
>    - Fetch raw DAT from `libretro-database` GitHub mirror.
> 2. **DAT Parser**: Implement a CLRMamePro parser (using regex or `datfile` lib) to extract Title/SHA1/CRC.
> 3. **SQLite Metadata Store**: Store DAT entries in a local SQLite DB (`~/.mesh-arkade/dats.db`).
> 4. **CLI Search**: Implement `mesh search <query>` to look up entries in the local Wishlist.
> 5. **Sandbox Test**: Verify this works at `E:\mesh_arkade_dev` by initializing an NES wish-list."

---

## **[05] Curation Milestone 2: The Multi-Layer Recovery (P2P Fetch)**
**Status**: Backlog
**Context**: Implementing the Triple-Layer Discovery (Pear Swarm -> Torrent -> IPFS) to allow "From Zero" library creation.

### **Proposed Implementation Prompt:**
> /opsx-propose "Implement Curation Milestone 2: P2P Multi-Layer Recovery (`milestone-05`)
> 
> **Objective**: Build the `mesh fetch` command with P2P fallbacks.
> 
> **Requirements**:
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
