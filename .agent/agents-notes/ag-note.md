# Antigravity Notes
These notes belong to the antigravity agent.
They may edit and organize these notes as they see fit.

# Backlog
- [ ] Initialize Git repository
- [ ] Initialize NPM workspace
- [ ] Setup TypeScript with strict configuration
- [ ] Configure TSDoc enforcement and coverage
- [ ] Integrate TDD workflow into OpenSpec proposals

# Current Focus
- [/] Initializing environment (Git, NPM, TS)
- [ ] Establishing TDD patterns for OpenSpec

# Notes to future self
- **AGENTS.md**: Shared guidelines between me and Opencode. Focuses on tech stack, style, and commands.
- **GEMINI.md**: My personal pair programming and project management instructions.
- **Pear Runtime**: Core dependency. Always refer to `pear-runtime` skill and `references/pear-annealing.md`.
- **OpenSpec**: The bridge between my planning and Opencode's execution.
- **TDD Priority**: Every proposal must include a verification plan that follows TDD. Tests first.
- **Documentation**: Use TSDoc for commenting and enforce coverage.
- **Git Strategy**: Create a new feature branch for every new OpenSpec proposal before drafting.
- **Roadmap-First Flow**: Instead of jumping to OpenSpec, we maintain a `roadmap.md` in `.agent/`. This allows us to strategize, reorder, and refine goals before formalizing them into OpenSpec changes.
- **Opencode Context Protocol**: Opencode is "on rails" and fresh per session. Every OpenSpec proposal MUST include explicit tasks for it to gather context (e.g., "Read the pear-runtime skill", "Ask DeepWiki about X").
- **Design Philosophy**: "Accessible Museum" — The UI must be simple enough for casual play/contribution, while providing deep archival metadata and technical info for those who seek it.

# Decisions
- [2026-03-12] Using `ag-note.md` for long-term project context and "desk" organization.
- [2026-03-12] Environment base: TypeScript, NPM, TSDoc, TDD.
- [2026-03-12] UX Mandate: Progressive Disclosure. Museum quality internals/metadata, but a frictionless consumer-facing experience.
- [2026-03-12] Roadmap-First Flow: Using `.agent/roadmap.md` as a staging area for ideas before formal OpenSpec proposals.
- [2026-03-12] Branding Strategy: Central `branding.ts` for identity (Name, Tagline, Colors).
- [2026-03-12] UI Component Choice: `shadcn/ui` + `8bitcn`. Default to 8-bit retro, but maintain 1-to-1 mapping with modern shadcn for user customizability.
- [2026-03-12] Data Ground Floor: Use Libretro DATs (No-Intro) for hashing and metadata verification.
- [2026-03-12] P2P File Bridge: DAT Verification -> IPFS -> Magnet/Torrent conversion. Only verified files are swarm-visible.
- [2026-03-12] Milestone Complete: `init-environment` (Environment setup, TDD, TSDoc) archived to `openspec/changes/archive/2026-03-12-init-environment`.
- [2026-03-12] Proposal Protocol: All proposals must explicitly command Opencode to read the `pear-runtime` skill and relevant docs at the start of tasks to ensure context isn't lost.
- [2026-03-12] Architectural Guardrail: Use **Local Streaming Bridge** via `pear-bridge` for ROM/Core data to prevent IPC memory bottlenecks between Bare and React processes.
- [2026-03-12] Research Goal: Establish a decentralized "Root of Trust" (e.g., Curator Multi-Sig) to allow trustless P2P distribution of DAT files.
- [2026-03-12] CTO Guardian Role: Use safeword **"Timeout! ⏰"** if user requests deviate from Pear architecture or P2P/Decentralized best practices.
- [2026-03-12] Distribution Policy: **On-Demand Only**. Users only download what they interact with (ROMs, metadata, media).
- [2026-03-12] Sharing Policy: **Mandatory Participation**. Sharing is non-optional to maintain swarm health. Users can throttle speed/connections, but never disable sharing entirely. The app acts as a decentralized tracker/gateway between Pear Swarms and IPFS/Torrents.

# Resources and References
links to helpful resources and references.