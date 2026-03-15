# Antigravity Notes (MeshARKade)

## Current State: Post-04b, Planning Phase

**Date:** 2026-03-15
**Branch:** main (1 local archive commit pending push — rides with next real change)

### Completed Milestones
- [x] [00] Production Contribution Workflow (CI, branch protection, Devin review)
- [x] [01] React UI & Branding Foundation (paused for CLI-first)
- [x] [02] The Core Engine (Headless/Bare)
- [x] [03] The Curator CLI (Library Mount Manager)
- [x] [04] Curation Bootstrap (DAT & Hyperbee) — PR #3
- [x] [04a] Refactor Phase 1: Extract CLI Layer — PR #5
- [x] [04b] Refactor Phase 2: Centralize Runtime Utilities — PR #6 (squash-merged)

### In-Flight
- **PR #8**: Remove unused `_systemId` parameter from dat-parser functions — open, awaiting CI + Devin review

### Open Cleanup
- `CachedSystems` dead interface in curation.ts — pre-existing, not introduced by 04b

### Next Up
- [ ] [05] Curation Milestone 2: P2P Multi-Layer Recovery (Pear Swarm → Torrent → IPFS)
- [ ] [06] Normalization & TorrentZip (Rust NAPI-RS)

### Engineering Principles (codified in CLAUDE.md)
- SOLID, DRY, TDD — all proposals and implementations must follow

### Architecture (stable)
- `runtime.ts` — Bare/Node module loader (fs, path, os, fetch) with caching
- `paths.ts` — Single source of truth for Pear storage path resolution
- `dat-parser.ts` — Pure DAT parsing functions (CLRMamePro + XML)
- Factory pattern: `createCurator()`, `createCurationManager()`
- `any` types in runtime.ts are intentional — bare-* modules have narrower type surfaces than Node built-ins

### OpenSpec Specs (synced to main)
- `openspec/specs/runtime-loader/` — runtime.ts capability spec
- `openspec/specs/storage-paths/` — paths.ts capability spec
- `openspec/specs/dat-parser/` — dat-parser.ts capability spec
- `openspec/specs/core-engine/` — hub architecture
- `openspec/specs/env-config/` — environment detection
- `openspec/specs/ui-foundation/` — branding system

---

## Tooling & Workflow

### Multi-Agent Setup
- **Claude Code (me):** Pair programmer, spec author, Devin review handler, strategic planning
- **Opencode:** Implementation agent — receives task prompts, delivers code
- **Devin:** Automated PR reviewer — posts deep scans on every commit

### Devin Review Cycle
`scripts/devin-review.sh` handles fetch/reply/resolve. Standard responses for recurring findings:
- `any` types: "Pragmatic dual-runtime workaround. Will tighten as Bare types mature."
- Bare built-ins: "`bare-*` modules are runtime built-ins, not npm dependencies."

### Vibe-Kanban (MCP Server Configured)
- Visual kanban board for tracking which agent is doing what
- Uses git worktrees for task isolation — each card gets its own worktree + branch
- MCP server installed at project scope in `.claude.json` — needs session restart to activate
- Config: `npx -y vibe-kanban@latest --mcp`
- Would NOT replace OpenSpec — layers on top for visual orchestration
- Key value: Lofi can see all agent work at a glance instead of juggling terminals
- Also provides one-click rebase, merge, conflict resolution
- **NOT part of mesh-arkade codebase** — it's a standalone app like an IDE

### Key Preferences (from memory)
- Brainstorm before executing — no auto-proposals
- Terse responses, no trailing summaries
- Explicit git add, no force push
- Archive commits ride with next real change — no standalone PRs
- Terminal-first, Bare-compatible core logic

---

## Architectural Decisions (Stable)

### Terminal-First / Multi-Runtime
- Core logic must be runtime-agnostic (Pure JS/Bare)
- Headless mode for remote/server scenarios
- Two-World Execution: Bare for P2P/Hypercore, React for UI

### Preservation & Data
- Source of truth: Libretro / No-Intro DAT files
- Curator-First: Verification (DAT) precedes Playback
- Normalization via TorrentZip for bit-perfect identity
- P2P: DAT Hash → TorrentZip → IPFS → Magnet/Torrent Gateway

### Patterns & Gotchas
- Atomic file writes: `.tmp` + `rename()` for config/metadata
- Always filter `.mesh-hub` during library scans
- `Pear.teardown()` over `process.on('exit')`
- JSONL framing for external consumers

---

## Resources
- **Roadmap:** `.agent/roadmap.md`
- **Preservation Standards:** `.agent/agents-notes/preservation-standards.md`
- **OpenSpec Workflow:** `.claude/skills/openspec-*/`
- **Pear Reference:** `.claude/skills/pear-runtime/`, `.claude/skills/pear-cli/`
