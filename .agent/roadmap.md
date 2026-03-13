# Mesh-Arkade Project Roadmap (Curator Overhaul)

**Repository:** [LoFi-Monk/mesh-arkade](https://github.com/LoFi-Monk/mesh-arkade)

This roadmap tracks our strategic goals. Commands are prompt-style to give the implementation agent (Opencode) full context. 

---

## **[00] Production Contribution Workflow (Safety & CI)**
**Status**: Completed ✓
**Context**: Implement a production-grade safety net. Setting up GitHub Actions, branch protection rules (PRs required, checks must pass, threads resolved), and AI-led review integration to ensure the `main` branch is a fortress of quality.

---

## **[01] React UI & Branding Foundation**
**Status**: Backlog
**Context**: Implement the React-based branding system.
### **Proposed Implementation Prompt:**
> /opsx-propose "Implement the React UI & Branding Foundation (`milestone-01`)
> 
> **Objective**: Setup the Vite/React frontend with a dedicated 8-bit branding component set.
> 
> **Requirements**:
> 1. **Vite Setup**: Ensure the React app is correctly served by Pear.
> 2. **Branding Components**: Port `branding.ts` values into CSS variables and React hooks.
> 3. **8-Bit CSS System**: Create a `GlitchText` and `RetroContainer` component using vanilla CSS.
> 4. **Splash Screen**: Implement the scanline-animated splash screen as a React component."

## **[02] The Core Engine (Headless/Bare)**
**Status**: Completed ✓
**Context**: Establish the "Hub" architecture. Refactor `branding.ts` into `src/core` for shared identity. Implement a dual-mode `index.js` that detects Bare (CLI) vs. Electron (GUI). Create a high-quality 8-bit ASCII terminal splash screen and integrate `pear-terminal` for a persistent CLI status footer.

## **[03] The Curator CLI (Mount Manager)**
**Status**: ACTIVE [/]
**Context**: Implement the "Cellular Library" logic. Allow the engine to `mount` external directories, detect existing ROMs, and `sanctify` paths by creating a local Hypercore metadata index (`.mesh-hub`). 

### **Next Prompt for Implementation Agent:**
> /opsx-propose "Implement the Curator Library Mount Manager (`milestone-03`)
> 
> **Objective**: Create the core mount and indexing logic for ROM discovery.
> 
> **Requirements**:
> 1. **Hypercore Indexing**: Initialize an append-only log in `<mounted-dir>/.mesh-hub/` to track file metadata. (Cellular approach: the library index travels with the media).
> 2. **TDD First**: Create `src/core/__tests__/curator.test.ts` for discovery logic.
> 3. **Mount Logic**: Implement `CuratorManager.mount(path?)`. 
>    - **Interactive Flow**: If no path is provided, the CLI MUST prompt the user "Where is your library?" and provide a native directory picker if possible (or a clean text prompt).
> 4. **CLI Wizard**: If it's a "First Run" (no existing mounts), automatically trigger the library mount wizard.
> 5. **JSON-RPC**: Ensure `CoreHub` has a `curator:mount` method."

---

## **[04] The Preservation Deck (Web/PWA Bridge)**
**Status**: Backlog
**Context**: Serving the UI over HTTP for remote curators.
### **Proposed Implementation Prompt:**
> /opsx-propose "Implement the Preservation Deck Web Bridge (`milestone-04`)
> 
> **Objective**: Enable the app to act as a web server for remote UI access.
> 
> **Requirements**:
> 1. **Hyper-HTTP**: Use `hyperswarm` or a simple HTTP server to serve the React assets.
> 2. **PWA Manifest**: Add service worker and manifest for 'Add to Home Screen' support.
> 3. **Remote Auth**: Implement a simple pairing code or token for remote access safety."

---

## **[05] The Unified Design System & Museum UI**
**Status**: BACKLOG (Paused)
**Context**: Deepening the 8-bit aesthetic across all components.
### **Proposed Implementation Prompt:**
> /opsx-propose "Expand the Unified Design System (`milestone-05`)
> 
> **Objective**: Build a complete 8-bit component library (shadcn/8bit style).
> 
> **Requirements**:
> 1. **Primitive Expansion**: Buttons, Cards, Modals, and Tooltips with custom 8-bit borders and scanline overlays.
> 2. **Focus Management**: Robust keyboard/remote navigation for all interactive elements.
> 3. **Theme Sync**: Shared state between terminal CLI themes and Web UI themes."

---

## **[06] P2P Core & Peer Discovery**
**Status**: Backlog
**Context**: Hyperswarm integration for node finding.
### **Proposed Implementation Prompt:**
> /opsx-propose "Integrate P2P Core & Discovery (`milestone-06`)
> 
> **Objective**: Enable curators to find each other in the swarm.
> 
> **Requirements**:
> 1. **Hyperswarm Setup**: Announce and lookup the `mesh-arkade` topic.
> 2. **Peer Protocol**: Implement a custom wire protocol for sharing library manifests.
> 3. **Discovery Service**: A background service that maintains a list of 'Live Libraries'."

---

## **[07] The Gateway: IPFS, Magnets, & Distribution**
**Status**: Backlog
**Context**: Converting verified files into CIDs and Torrent infohashes.
### **Proposed Implementation Prompt:**
> /opsx-propose "Implement the IPFS/Magnet Gateway (`milestone-07`)
> 
> **Objective**: Bridge the Hypercore library to global distribution standards.
> 
> **Requirements**:
> 1. **CID Generation**: Automatically generate IPFS CIDs for all 'Sanctified' ROMs.
> 2. **Magnet Exporter**: Convert local metadata into magnet links.
> 3. **Seed Manager**: Track which files are actively being seeded to the swarm."

---

## **[08] Curator Tools: Exhibits & Social Archival**
**Status**: Backlog
**Context**: User-generated content and exhibit creation.
### **Proposed Implementation Prompt:**
> /opsx-propose "Build Curator Tools & Exhibits (`milestone-08`)
> 
> **Objective**: Allow users to 'curate' specific games with notes and save states.
> 
> **Requirements**:
> 1. **Exhibit Creation**: Combine a ROM+Metadata+Note into a shareable JSON-RPC exhibit.
> 2. **Signature Saves**: Capture emulator save states as P2P-sharable snapshots.
> 3. **Social Manifest**: A shared Hypercore for 'Global Curator Picks'."

---

## **[09] The Arcade View: Gamepad & Ten-Foot UI**
**Status**: Backlog
**Context**: Controller-first navigation and couch-compatible UI.
### **Proposed Implementation Prompt:**
> /opsx-propose "Implement Arcade View Gamepad Support (`milestone-09`)
> 
> **Objective**: A high-impact 'Arcade' mode for TVs and controllers.
> 
> **Requirements**:
> 1. **Gamepad API**: Native controller support for library browsing.
> 2. **FullScreen Mode**: Automatic fullscreen toggle when entering Arcade view.
> 3. **Audio UI**: Responsive 8-bit sound effects for navigation."

---

## **[10] The Living Identity: Dynamic Tagline Engine**
**Status**: Completed ✓
**Context**: Implement the "Glitch Transition" and dynamic tagline rotation defined in `branding.ts`.

---

## **[11] The Background Seeder: Tray & Startup Logic**
**Status**: Backlog (User Request)
**Context**: Low-resource seeder mode.
### **Proposed Implementation Prompt:**
> /opsx-propose "Implement Background Seeder Mode (`milestone-11`)
> 
> **Objective**: Allow the archive to seed quietly on system startup.
> 
> **Requirements**:
> 1. **System Tray Integration**: Add a Pear-compatible tray icon for Windows/Linux.
> 2. **Startup Manager**: Logic to launch the seeder process on boot.
> 3. **Resource Throttle**: Limit CPU/Network usage when running in background."
