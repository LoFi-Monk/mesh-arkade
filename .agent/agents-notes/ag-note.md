# Antigravity Notes (MeshARKade)

# Current Progress: Unified Design System Phase 1

## Status: PLANNING (Terminal-First Pivot)

The user proposed a "Terminal First" strategy. We are refactoring the roadmap to prioritize a headless engine (Curator CLI) that can serve the UI over the network (PWA) or locally via Electron.

### Completed:
- [x] Initialized shadcn v4 and `@8bitcn` registry.
- [x] Installed base components (`button`, `card`).
- [x] Set up `src/lib/branding.ts` and `src/lib/utils.ts`.
- [x] Updated `src/index.css` with Tailwind v4 and retro fonts.
- [x] Refactored `src/components/ui/8bit/button.tsx` for Vite compatibility.
- [x] Integrated `RetroModeSwitcher` and `WindowControls`.

### Blockers/Bugs to fix on resume:
1. **ReferenceError: process is not defined**: `WindowControls.tsx` uses `process.env.NODE_ENV`. Need to change to `import.meta.env.DEV`.
2. **UI Rendering**: Verification shows a blank screen or legacy UI. Likely due to the crash above blocking the module evaluation.

### Next Steps:
- Apply the `WindowControls` fix.
- Final browser verification for the "wow" factor.

This is the primary organizational space for the Antigravity agent. 

## 🏔️ Current Focus
- [01]: React UI & Branding (Merged)
- [/] [02]: The Core Engine (Headless/Bare) - STAGED
- [ ] [03]: The Curator CLI (Cellular Mount Manager)
- [ ] [04]: The Preservation Deck (Web/PWA Bridge)
- [ ] [05]: Modern Museum UI (Paused)

### 🌊 Workflows
- **Start Session**: [/session-start](file:///c:/ag-workspace/mesh-arkade/.agent/workflows/session-start.md)
- **End Session**: [/session-end](file:///c:/ag-workspace/mesh-arkade/.agent/workflows/session-end.md)

## 📋 Project Checkpoint
- **Git**: Branching strategy enforced (master + feature branches).
- **Pear**: DX optimized with HMR (Bridge Addr Trick).
- **OpenSpec**: Baseline specs established in `openspec/specs/`.

---

## 🏗️ Architectural Decisions

### 🌍 Terminal-First / Multi-Runtime Architecture
- **Engine-First**: Core logic (DAT, Swarm, Vault) must be runtime-agnostic (Pure JS/Bare).
- **Headless Mode**: Support running without a GUI for remote/server scenarios.
- **Museum Bridge**: The UI is treated as an "Exhibition" layer that connects to the local Engine.
- **Two-World Execution**: Bare for P2P/Hypercore logic, React for UI. Isolated via `pear-bridge`.
- **HMR Pattern**: Use the **"Bridge Addr Trick"** in `index.js`. Point `runtime.start({ bridge: { ...bridge, addr: 'http://localhost:5173' } })` to Vite while maintaining the Pear API link.
- **Data Flow**: Use a **Local Streaming Bridge** (via `pear-bridge`) for large binary data (ROMs/Cores) to bypass IPC memory limits.
- **Distribution**: **On-Demand Only**. Users download what they interact with. **Mandatory Sharing** is the baseline for swarm health.

### 🍱 UX & Branding
- **Philosophical North**: "Accessible Museum" — Progressive disclosure of technical/archival metadata.
- **Design Tokens**: Centralized in `src/branding.ts` for identity-level consistency.
- **🍱 UI Strategy**: `shadcn` (structure) + `8bitcn` (aesthetic). Must build robust **Focus States** in [02] to support future Gamepad/10-foot UI.
- **🎮 Gamepad Input**: Long-term goal for the "Arcade View". Need to research Gamepad API in Electron renderer.
- **📥 Background Seeder**: Milestone [11] goal. Use `ui.app.tray` to allow low-resource background seeding without UI.
- **Identity Logic**: Dual randomization. Independent "Descriptor" (A Decent Game Vault) and "Tagline" (Seed the Archive).

### 🏛️ Preservation & Data
- **Preservation Standards**: Codified in [preservation-standards.md](file:///c:/ag-workspace/mesh-arkade/.agent/agents-notes/preservation-standards.md).
- **Curator-First Flow**: Verification (DAT) must precede Playback (Emulator). Nothing is "Museum Quality" until verified.
- **Source of Truth**: Libretro / No-Intro DAT files. Verification is mandatory before a file is visible to the swarm.
- **Normalization (TorrentZip)**: Critical for swarm health. All shared files must be bit-perfect masters (headerless, standardized).
- **Decentralized Trust (Anti-Spoofing)**:
    - **Ed25519 Signatures**: Use signed Hypercores for DAT distribution. Only keys belonging to trusted curators (Guardians) can publish "Canonical" DAT updates.
    - **Deterministic Scraping**: Nodes run the same scraper JS; their results must match the signed hash of the "Oracle."
    - **Multi-Sig Guardians**: Require M-of-N signatures for sensitive updates (System BIOS DATs).
- **P2P Path**: DAT Hash Verification -> TorrentZip Normalization -> IPFS -> Magnet/Torrent Gateway.
- **Root of Trust**: (Future) Investigate Curator Multi-Sig for decentralized DAT signing.

---

## 🚨 CRITICAL RULES (AG)
- **NO AUTO-PROPOSALS**: Never initiate a new `openspec` change or proposal without explicit user request.
- **NO AUTO-TASKS**: Do not use `task_boundary` for research or brainstorming.
- **PEER OVER AGENT**: Prioritize being a pair-programmer over being an "autonomous agent".

---

## 📓 Technical Knowledge (Annealing)
- **Pear-Electron Initialization**: Always include `"pre": "pear-electron/pre"` in `package.json`.
- **Pear.teardown()**: Preferred over `process.on('exit')` for cleaning up Swarms/Corestores.
- **Ignore Strategy**: Define `pear.stage.ignore` explicitly. REMEMBER: `.git` is NOT auto-ignored if a custom list exists.

---

## 🛠️ Resources
- **DeepWiki**: AI-grounded research for the Holepunch/Pear ecosystem.
- **Pear Skill**: `.agent/skills/pear-runtime/SKILL.md` (Refer to for Bare API).
- **Roadmap**: `.agent/roadmap.md` (Strategic overview).