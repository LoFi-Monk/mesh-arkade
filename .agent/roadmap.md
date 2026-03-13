# Mesh-Arkade Project Roadmap (Curator Overhaul)

**Repository:** [LoFi-Monk/mesh-arkade](https://github.com/LoFi-Monk/mesh-arkade)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context. 

---

## **[00] Production Contribution Workflow (Safety & CI)**
**Status**: ACTIVE [/]
**Context**: Implement a production-grade safety net. Setting up GitHub Actions, branch protection rules (PRs required, checks must pass, threads resolved), and AI-led review integration to ensure the `main` branch is a fortress of quality.

---

## **[01] React UI & Branding Foundation**

## **[02] The Core Engine (Headless/Bare)**
**Status**: Completed ✓
**Context**: Establish the "Hub" architecture. Refactor `branding.ts` into `src/core` for shared identity. Implement a dual-mode `index.js` that detects Bare (CLI) vs. Electron (GUI). Create a high-quality 8-bit ASCII terminal splash screen and integrate `pear-terminal` for a persistent CLI status footer.

## **[03] The Curator CLI (Mount Manager)**
**Status**: ACTIVE [/]
**Context**: Implement the "Cellular Mount" logic. Allow the engine to `mount` external directories, detect existing ROMs, and `sanctify` paths by creating a local Hypercore metadata index (`.mesh-hub`).
**Capabilities**:
- `mesharkade mount <path>`: Atomic discovery and indexing.
- `mesharkade sanctify`: Scaffolding a museum structure on empty drives.
- **Sparse Sync**: Support for fetching only requested ROM bytes (Fetch-on-Demand).

---

## **[04] The Preservation Deck (Web/PWA Bridge)**
**Status**: Backlog
**Context**: Serving the UI. Allow the app to act as a server for remote curators (Headless + PWA).

---

## **[05] The Unified Design System & Museum UI**
**Status**: BACKLOG (Paused)
**Context**: Implement the "Accessible Museum" aesthetic. Build on the Phase 1 8bitcn/shadcn work once the terminal tools are solid.

---

## **[06] P2P Core & Peer Discovery**
**Status**: Backlog
**Context**: Networking layer using Hyperswarm and Hypercore. Finding other curators in the swarm.

---

## **[07] The Gateway: IPFS, Magnets, & Distribution**
**Status**: Backlog
**Context**: Converting verified files into IPFS CIDs and Magnet links. The app acts as a P2P tracker for decentralized distribution.

---

## **[08] Curator Tools: Exhibits & Social Archival**
**Status**: Backlog
**Context**: User-generated content. Attaching metadata, personal notes, and "Signature Save States" to specific games to share them as "Exhibits" in the swarm.

---

## **[09] The Arcade View: Gamepad & Ten-Foot UI**
**Status**: Backlog
**Context**: A simplified "BigBox-lite" interface designed for couches and controllers. Builds on the focus-state foundation laid in Phase 2 (whenever that returns).

---

## **[10] The Living Identity: Dynamic Tagline Engine**
**Status**: Completed ✓
**Context**: Implement the "Glitch Transition" and dynamic tagline rotation defined in `branding.ts`.

---

## **[11] The Background Seeder: Tray & Startup Logic**
**Status**: Backlog (User Request)
**Context**: Low-resource operation. Allow the app to seed in the background without the full UI open.
