# MeshARKade — Shared Agent Context

> This file is the shared context for all agents (Claude, Gemini, Devin, AutoMaker agents).
> Read this at the start of every session. It is the source of truth for project state and workflow.

---

## Project Overview

**MeshARKade** is a decentralized, museum-quality, takedown-resistant game preservation platform built on Pear Runtime (P2P), IPFS, BitTorrent DHT, and NostalgistJS for in-browser play.

**Philosophy**: "Accessible Museum" — curator-first, verification-first. Nothing is museum quality until verified against a DAT file.

**Stack**: Pear Runtime (Bare + Electron), Hyperbee, Hyperswarm, IPFS, BitTorrent DHT, NostalgistJS, React (UI layer, future).

**Myrient shutdown: 2026-03-31.** Major ROM preservation archive going offline. P2P layers are critical infrastructure.

---

## Current Status — 2026-03-18

### Active Branch
`feature/refactor-bittorrent-ts-into-focused-modules-spwo`
Worktree: `.worktrees/feature-refactor-bittorrent-ts-into-focused-modules-spwo`

### PR #16 — BitTorrent Wire Protocol ✅ Merged
369 tests passing. All Devin review threads resolved. Squash-merged to main.

### What's on main
- `src/fetch/layers/bittorrent.ts` — full DHT + wire protocol implementation (1257 lines)
- bencode/bdecode, DHT client, UDP transceiver, TCP peer fetch, piece assembly
- SHA1 used as DHT info_hash (intentional — see Intentional Design Decisions below)
- Dual-timer pattern in `fetchFromPeer` (intentional — see below)

### What's in progress
- **Refactor bittorrent.ts into focused modules + documentation** — split into 6 focused modules, write ADR and architectural context doc alongside the split

---

## Milestone Status

| Milestone | Status |
|-----------|--------|
| 00 — Production Workflow & CI | ✅ Complete |
| 01 — React UI & Branding Foundation | ⏸ Paused (CLI-first pivot) |
| 02 — Core Engine (Headless/Bare) | ✅ Complete |
| 03 — Curator Mount Manager | ✅ Complete |
| 04 — DAT Bootstrap & Curation | ✅ Complete |
| 04a — CLI Layer Extraction | ✅ Complete |
| 04b — Centralize Runtime Utilities | ✅ Complete |
| 05 — P2P Fetch (Triple-Layer) | ✅ Complete |
| 06 — BitTorrent Wire Protocol | ✅ Complete (PR #16 merged) |
| 06a — BitTorrent Modularization + Docs | 🚀 In Progress |
| N — Normalization & TorrentZip | 📋 Backlog |
| N — Emulation Layer | 📋 Backlog (Phase 3+) |

---

## Workflow

Development is managed via **AutoMaker** (running at `:3008`). OpenSpec and Opencode are retired.

1. Claude + Lofi brainstorm → agree on approach
2. Lofi creates a feature card in AutoMaker UI
3. AutoMaker agent implements the card on the assigned worktree/branch
4. Card lands in `waiting_approval` (skipTests: true) or `verified` (skipTests: false)
5. Lofi clicks "Run Tests" (`npm test -- --coverage`) to confirm green
6. Lofi commits and pushes manually — CI runs — Devin reviews
7. Claude triages Devin feedback (`/devin-review`) → new cards for real fixes, reply/resolve for intentional design
8. Repeat until green → merge

**Important workflow notes:**
- AutoMaker agents bypass Husky — they use raw git calls. Hooks do not fire.
- Lofi commits manually. Agents do not commit.
- "Run Tests" in AutoMaker UI runs `npm test` — no coverage. Always use `npm test -- --coverage` to check thresholds.
- Cards must have a branch and worktree assigned before starting. Agents on `main` will block the main branch.

---

## Agent Roles

| Agent | Role | Config |
|-------|------|--------|
| **Claude** | Pair programmer, architect, code reviewer, AutoMaker workflow manager | `CLAUDE.md`, `.claude/` |
| **Gemini** | Pair programmer | `GEMINI.md`, `.geminiignore` |
| **AutoMaker agents** | Code implementation — implement tasks from feature cards | AutoMaker UI at `:3008` |
| **Devin** | Automated PR code review | GitHub PR integration |

---

## Context Map

Read these before implementing. They are the source of truth.

| What | Where |
|------|-------|
| Engineering standards (TDD, TypeScript, TSDoc, SOLID, Bare compat) | `.automaker/context/engineering-standards.md` |
| Roadmap & milestone carry-forward items | `.automaker/context/roadmap.md` |
| Architecture Decision Records | `docs/adr/` |
| BitTorrent DHT research & design decisions | `.automaker/context/bittorrent-dht-research.md` |
| AutoMaker runbook (card behavior, gotchas) | `.claude/notes/automaker-runbook.md` |
| Pear platform docs | https://github.com/holepunchto/pear-docs |
| Hyperswarm | https://github.com/holepunchto/hyperswarm |
| Hyperbee | https://github.com/holepunchto/hyperbee |

---

## Architecture Decisions

Decisions that are final. Do not re-propose alternatives without new evidence.

| # | Decision | File |
|---|----------|------|
| 0001 | Use MADR format for architecture decisions | `docs/adr/0001-adr-standard.md` |
| 0002 | Hyperbee over SQLite for metadata storage (Bare-friendly, P2P-portable) | `docs/adr/0002-hyperbee-metadata-storage.md` |

---

## Intentional Design Decisions

These will look wrong. They are not. Do not change them.

- **SHA1 as DHT info_hash**: We use the ROM's SHA1 hash as the BitTorrent DHT info_hash. This is NOT standard BEP 3 (which uses SHA1 of the torrent's `info` dictionary). It is a deliberate design for our custom P2P mesh — peers find ROMs by their file hash, not by torrent metadata.
- **bdecode operates on raw Uint8Array**: `TextDecoder('latin1')` corrupts bytes 0x80–0x9F via Windows-1252 mapping. bdecode uses byte-level index arithmetic instead. Do not add TextDecoder back.
- **Dual timer in fetchFromPeer**: `deadlineTimer` (overall timeout, never cleared by data) and `inactivityTimer` (5s per-piece, reset on each block received). This is intentional — it prevents an adversarial peer from holding a connection open indefinitely by trickling data.

---

## Engineering Standards (summary)

Full doc: `.automaker/context/engineering-standards.md`

- **TDD**: Tests before or alongside implementation. No production code without tests.
- **TypeScript**: No `any`. No type assertions unless unavoidable.
- **TSDoc**: Every export needs `@intent`, `@guarantee`, `@constraint` — not implementation restatements.
- **Bare compat**: No `require('fs')` / `require('crypto')` / `fetch` directly. Use `getFs()`, `getCrypto()`, `getFetch()` from `src/core/runtime.ts`.
- **SOLID + DRY**: Single responsibility. No duplicated logic. Compose, don't modify.
- **Git**: Never `git add .`. Never force push. Explicit file staging only.

---

## Build & Test Commands

```bash
npm install                    # install dependencies
npm test                       # run all tests (no coverage)
npm test -- --coverage         # run tests WITH coverage (matches CI)
npm run typecheck              # TypeScript strict check — zero errors required
npm run lint                   # lint check
node index.js --silent systems            # list game systems
node index.js --silent init --seed=nes   # seed NES DAT
node index.js --silent search "Mario"    # search wishlist
```

**CI runs**: `npm run typecheck` → `npm test -- --coverage` → `npm audit --audit-level=high` → `node scripts/check-tsdoc.mjs --strict`

Coverage threshold: 80% for lines, statements, branches, functions.

---

## Technical Gotchas

- **Atomic file ops**: Always write to `.tmp` then `rename()`. See `src/core/storage.ts`.
- **Bare runtime shims**: `package.json` `imports` field maps `fs`, `crypto`, `fetch` to bare-* modules. Do not bypass.
- **Pear teardown**: Use `Pear.teardown()`, not `process.on('exit')`.
- **pear-electron init**: Always include `"pre": "pear-electron/pre"` in `package.json`.
- **DAT parser**: CLRMamePro `rom (...)` blocks use quoted strings for names with parentheses — regex must handle `"[^"]*"`.
- **CLI flag parsing**: Only strip top-level app flags (`--silent`, `--json`, `--bare`, `--headless`, `--help`) before passing args to handlers.
- **Recursive guards**: Always filter `.mesh-hub` during library scans.
- **AutoMaker card location**: Cards live in `.automaker/features/{id}/feature.json` on the main repo. Worktrees have their own copy. Always create and manage cards from the main AutoMaker UI.
