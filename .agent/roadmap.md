# Mesh-Arkade Project Roadmap (Curator Overhaul)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context. 

---

## **[01] React UI & Branding Foundation**
**Status**: Completed ✓
**Context**: Establish the dual-world architecture (`pear-electron` + `pear-bridge`) and the central branding identity.

---

## **[02] The Core Engine (Headless/Bare)**
**Status**: PLANNING [/]
**Context**: Build the runtime-agnostic engine. Refactor `branding.ts` and core logic into a shared module that can run in both Terminal and Electron. 

---

## **[03] The Curator CLI (Terminal Interface)**
**Status**: Backlog
**Context**: Direct tool access for power users. All [04]-[07] features (Ingestion, Scanning, Normalization) must be implemented here *before* the UI.

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
**Status**: Staged
**Context**: Implement the "Glitch Transition" and dynamic tagline rotation defined in `branding.ts`.

---

## **[11] The Background Seeder: Tray & Startup Logic**
**Status**: Backlog (User Request)
**Context**: Low-resource operation. Allow the app to seed in the background without the full UI open.
