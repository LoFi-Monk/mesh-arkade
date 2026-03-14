# MeshARKade — Shared Agent Context

> This file is the shared memory for all agents (Claude, Gemini/Antigravity, Opencode, Devin).
> Read this at the start of every session. Update it at the end of every session.

---

## Project Overview

**MeshARKade** is a decentralized, museum-quality, takedown-resistant game preservation platform built on Pear Runtime (P2P), IPFS, magnet torrents, and NostalgistJS for in-browser play.

**Philosophy**: "Accessible Museum" — curator-first, verification-first. Nothing is museum quality until it is verified against a DAT.

**Stack**: Pear Runtime (Bare + Electron), Hyperbee, Hyperswarm, IPFS, BitTorrent, NostalgistJS, React (UI layer, future).

---

## Current Status — 2026-03-14

### Active Branch: `feature/milestone-04-hyperbee-crawl`

**Milestone 04 implementation is complete and pending PR merge.**

The CLI is fully functional:
- `systems` — lists all available game systems from Libretro GitHub
- `init --seed <id>` — fetches No-Intro DAT and seeds local Hyperbee with titles + hashes
- `search <query>` — searches the local wishlist database
- `search --system=<id>` — lists all games for a system

### In Progress
- Opencode fixing TSDoc violations and removing `openspec validate` from lint-staged
- Once lint-staged passes → commit → push → CI → Devin PR review

### Pending
- [ ] Lint-staged fixes land from Opencode
- [ ] Commit and push `feature/milestone-04-hyperbee-crawl`
- [ ] CI green
- [ ] Devin PR review and remediation
- [ ] Refactor `index.js` (growing large — extract handlers to `src/cli/commands/`) — separate PR after merge

---

## Milestone Status

| # | Name | Status |
|---|------|--------|
| 00 | Production Contribution Workflow (CI, Branch Protection) | ✅ Complete |
| 01 | React UI & Branding Foundation | ⏸ Paused |
| 02 | Core Engine (Headless/Bare) | ✅ Complete |
| 03 | Curator CLI (Library Mount Manager) | ✅ Complete (PR #1 merged) |
| 04 | Curation Bootstrap (DAT + Hyperbee) | 🔄 In PR |
| 05 | Multi-Layer P2P Recovery (Fetch) | 📋 Backlog |
| 06 | Normalization & TorrentZip (Rust) | 📋 Backlog |
| 07 | Preservation Deck (Web/PWA Bridge) | 📋 Backlog |
| 08 | Curator Tools: Exhibits & Social | 📋 Backlog |
| 09 | Arcade View: Gamepad & 10-foot UI | 📋 Backlog |
| 10 | Living Identity: Dynamic Tagline | ✅ Complete |
| 11 | Background Seeder: Tray & Startup | 📋 Backlog |

---

## Architecture Decisions

> Full ADRs at `.agent/adr/` — single source of truth. Do not duplicate here.

- **ADR-0001**: Use MADR format for architecture decisions
- **ADR-0002**: Hyperbee over SQLite for metadata storage (Bare-friendly, P2P portable, no native binding issues on Windows)

### Core Principles
- **Terminal-First**: CLI is the universal interface. GUI is a skin on top. Friendly for humans and AI agents alike.
- **Engine-First**: Core logic must be runtime-agnostic (Pure JS/Bare). No DOM/Node assumptions.
- **Curator-First**: Verification (DAT hash match) must precede playback. Nothing enters the swarm unverified.
- **Two-World Execution**: Bare for P2P/Hypercore logic, React for UI — isolated via `pear-bridge`.
- **On-Demand Distribution**: Users download what they interact with. Mandatory sharing is the baseline for swarm health.

### Preservation Standards
- Source of truth: No-Intro (cartridge) and Redump (disc) DAT files
- Normalization: TorrentZip (T0Z) for bit-perfect identity across peers
- Anti-spoofing: Ed25519 signed Hypercores, Multi-sig Guardians for canonical DAT updates

---

## Technical Gotchas (Lessons Learned)

- **Atomic File Operations**: Always write to `.tmp` then `rename()`. `saveMounts` in `src/core/storage.ts` is the gold standard.
- **CLI Serialization**: Use `rl.pause()` / `rl.resume()` inside `rl.on("line")` for sequential async commands.
- **JSON Framing**: External consumers expect JSONL (newline-delimited JSON).
- **Recursive Guards**: Always filter `.mesh-hub` during library scans to prevent metadata-as-content indexing.
- **Pear Teardown**: Use `Pear.teardown()` not `process.on('exit')` for P2P resource cleanup.
- **Pear-Electron Init**: Always include `"pre": "pear-electron/pre"` in `package.json`.
- **`.git` ignore**: If a custom `pear.stage.ignore` list exists, add `.git` explicitly — it is NOT auto-ignored.
- **DAT Parser**: CLRMamePro `rom (...)` blocks use quoted strings for names with parentheses. Regex must handle `"[^"]*"` to avoid early termination on `)` inside game names.
- **CLI Flag Parsing**: Only strip top-level app flags (`--silent`, `--json`, `--bare`, `--headless`, `--help`) before passing args to command handlers. Command-specific flags (e.g. `--seed=nes`) must pass through.

---

## Build & Test Commands

```bash
npm install          # install dependencies
npm test             # run all tests (Vitest)
npm run typecheck    # TypeScript strict check
npx lint-staged      # run pre-commit checks manually
node index.js --silent systems            # list game systems
node index.js --silent init --seed=nes   # seed NES DAT
node index.js --silent search "Mario"    # search wishlist
```

---

## Agent Roles

| Agent | Role | Config |
|-------|------|--------|
| **Claude** | Pair programmer, architect, OpenSpec coordinator, code reviewer | `CLAUDE.md`, `.claude/` |
| **Gemini / Antigravity** | Pair programmer (being phased out) | `GEMINI.md`, `.agent/` |
| **Opencode** | Code execution — implements tasks from OpenSpec | `.opencode/` |
| **Devin** | Automated PR code review | GitHub PR integration |

---

## Workflow

1. Claude + Lofi brainstorm → agree on approach
2. Claude creates OpenSpec change (`/opsx/propose`)
3. Claude generates artifacts (proposal, design, tasks)
4. Opencode implements tasks (`/opsx/apply`)
5. Claude verifies output, runs tests
6. Commit + push → CI → Devin review
7. Claude triages Devin feedback (`/devin-remediate`) → delegates fixes to Opencode
8. Repeat until green → merge

---

## Resources

- **Roadmap**: `.agent/roadmap.md`
- **Preservation Standards**: `.agent/agents-notes/preservation-standards.md`
- **Pear Runtime Skill**: `.claude/skills/pear-runtime/SKILL.md`
- **ROM Expert Skill**: `.claude/skills/rom-expert/SKILL.md`
- **DeepWiki**: Ask user to relay questions for deep Holepunch/Pear ecosystem research
