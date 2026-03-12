# Mesh-Arkade Project Roadmap (CTO Refine)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context. 

---

## **[01] React UI & Branding Foundation**
**Status**: Ready to Propose
**Context**: Establish the dual-world architecture (`pear-electron` + `pear-bridge`) and the central branding identity.
**Command**:
```bash
/opsx-propose Setup a React + Vite boilerplate within Pear-Electron. MANDATORY: The task list must include reading the '.agent/skills/pear-runtime' references. Create a central "src/branding.ts" file containing our app name, tagline, and primary/secondary colors. Configure the Pear-Bridge to allow communication between the Bare P2P process and the React renderer.
```

---

## **[02] The Unified Design System (8bitcn + shadcn)**
**Status**: Planning
**Context**: Implement the "Theme Switch" capability. Use `shadcn/ui` as the structural foundation with `8bitcn` as the default retro aesthetic.
**Command**:
```bash
/opsx-propose Install Tailwind CSS, shadcn/ui, and 8bitcn. MANDATORY: Ask DeepWiki about best practices for integrating shadcn with Vite in a dual-runtime environment. Setup a component registry where every 8bitcn component has a shadcn equivalent. Configure Tailwind to ingest tokens from "branding.ts". Implement a themed Sidebar and Discovery Deck to verify the "Accessible Museum" look.
```

---

## **[03] The Preservation Deck: Nostalgist.js Integration**
**Status**: New Strategy
**Context**: Integrating the emulation engine. We will use Nostalgist.js in the React renderer. Key focus is on using the Pear-Bridge to stream verified ROMs and Libretro Cores. 
**Command**:
```bash
/opsx-propose Integrate Nostalgist.js into the React renderer. Create a "Consoles" view where the user can select an emulator core. Implement a TDD service that launches a core and verifies that save-state/load-state hooks are functioning. MANDATORY: Read the Nostalgist.js docs to ensure we can point 'core' and 'rom' URLs to our internal Pear-Bridge. **CRITICAL ARCHITECTURE**: Implementation must use a **Local Streaming Bridge** (via `pear-bridge`) to stream ROM data to Nostalgist, avoiding IPC memory bottlenecks.
```

---

## **[04] [RECOMMENDED / PENDING] Double-Verification & Social Archival**
**Status**: Recommendation Staged
**Context**: High-level features to elevate the museum experience.
**Details**:
- **TorrentZip Normalization**: Automatically normalize messy local ROMs into perfect DAT-verified dumps during scanning.
- **Shared Archival States**: Share "Signature Save States" (expert playthrough segments) over P2P.
- **Museum Tours**: Live P2P spectating/co-op "tours" led by a curator.

---

## **[04] The Ground Floor: DAT & Metadata Ingestion**
**Status**: Logic Mapping
**Context**: Connecting to Libretro No-Intro DATs. This is the source of truth for all verified files in the swarm.
**Command**:
```bash
/opsx-propose Create a Libretro DAT ingestion service. MANDATORY: Use DeepWiki to research the exact schema of No-Intro DAT files. Implement logic to parse these files and store them as local metadata. Build a TDD suite that verifies a local file's hash against the DAT source of truth. **RESEARCH**: Investigate a "P2P Root of Trust" or "Curator Multi-Sig" for trustless DAT distribution over Hyperswarm.
```

---

## **[05] P2P Core & Peer Discovery**
**Status**: Logic Mapping
**Context**: Networking layer using Hyperswarm. Finding other museum nodes.
**Command**:
```bash
/opsx-propose Initialize the P2P core using Hyperswarm and Hypercore. MANDATORY: Read the 'p2p-stack.md' and 'pear-annealing.md' references in the pear-runtime skill. Implement a peer discovery service in the Bare process. Create a "Swarm Pulse" component in React to visually show connected peers.
```

---

## **[06] The Gateway: IPFS, Magnets, & Decentralized Tracker**
**Status**: Backlog
**Context**: Converting DAT-verified files into IPFS/Magnet links. The app acts as a P2P tracker for external media/games.
**Command**:
```bash
/opsx-propose Implement the file-to-link conversion path. MANDATORY: Research IPFS-to-Magnet strategies. Implement a "Swarm Seeder" module in the Bare process that enforces **Mandatory Sharing** while allowing for speed throttling. Build a tracker service that indexes external IPFS/Magnet hashes and makes them discoverable within the internal Pear swarm.
```

---

## **[07] Curator Tools: Collections & Curation**
**Status**: Backlog
**Context**: Letting users check their own ROM folders against the DATs and curate "Exhibits" (save-states, historical context).
**Command**:
```bash
/opsx-propose Create a "Collection Scanner" that hashes local directories against the DAT ground floor. Implement a "Curator Mode" that allows users to attach TSDoc-verified metadata and "Signature Save States" to specific games, then share them via the swarm.

---

## **[08] The Living Identity: Dynamic Tagline Engine**
**Status**: Staged
**Context**: Implement the logic to rotate taglines and dynamic categories defined in `branding.ts`.
**Command**:
```bash
/opsx-propose Implement the dynamic tagline rotation logic in the React UI. MANDATORY: Read the 'branding.ts' file prepared in [01]. Create a "Glitch Transition" component that cycles through taglines and dynamic archival categories (e.g., 'A Decent Game Sanctuary', 'A Decent Game Vault') on app load or interval.
```
```
