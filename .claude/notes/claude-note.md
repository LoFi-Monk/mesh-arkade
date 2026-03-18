# Claude Notes (MeshARKade)

## Status
Milestone 06 complete. Milestone 06a (BitTorrent modularization + docs) in progress.

## Current Branch
`feature/refactor-bittorrent-ts-into-focused-modules-spwo`
Worktree: `.worktrees/feature-refactor-bittorrent-ts-into-focused-modules-spwo`

## PR #16 — MERGED
BitTorrent Wire Protocol squash-merged to main. 369 tests passing, all Devin threads resolved. No action needed on this PR.

## Active Card — Milestone 06a
**Refactor bittorrent.ts into focused modules + documentation**
Split `src/fetch/layers/bittorrent.ts` (1257 lines) into:
- `src/fetch/layers/bittorrent/bencode.ts`
- `src/fetch/layers/bittorrent/dht-utils.ts`
- `src/fetch/layers/bittorrent/udp-transceiver.ts`
- `src/fetch/layers/bittorrent/dht-client.ts`
- `src/fetch/layers/bittorrent/tcp-peer.ts`
- `src/fetch/layers/bittorrent/index.ts`

Write alongside the split (not after):
- `.automaker/context/bittorrent-architecture.md`
- `docs/adr/ADR-XXXX-bittorrent-custom-protocol.md` (SHA1-as-info_hash, raw Uint8Array bdecode, dual-timer)

Card is in AutoMaker, worktree assigned. AutoMaker agent will implement. Lofi commits after verification.

## Backlog (5 cards)
1. Refactor bittorrent.ts into focused modules ← ACTIVE
2. Fix Hub Resource Leak — `stop()` doesn't close Hyperbee/Corestore
3. Fix System Name Matching Bug — `getSystemDefinition` uses `.includes()` (nes matches snes)
4. Extract CLI Command Handlers
5. End-to-End Integration Test Harness

## Deferred Items
- **Trust & security hardening** (future milestone): tasks 12.4 and 12.5
- **Reply to Devin on intentional design decisions** — DONE this session via `gh-pr-review`
- **AutoMaker enhancements** — CLI to drive AutoMaker. Post-Myrient.
- **AutoMaker "Run Tests" script** — should use `npm test -- --coverage`. Currently runs `npm test`.
- **Gemini setup for AutoMaker** — `.geminiignore` exists. `AGENTS.md` is shared context. Working as pair programmer via terminal.

## Tooling
- AutoMaker UI: `:3008` (Electron). Ctrl+R to refresh after file edits.
- **Agents do not commit** — Lofi commits after each verified card.
- **CI command**: `npm test -- --coverage` — use this, not `npm test`.
- **gh-pr-review**: installed (`agynio/gh-pr-review`). Commands: `gh pr-review threads list`, `gh pr-review comments reply`, `gh pr-review threads resolve`.
- **AutoMaker card management gotchas**: `.claude/notes/automaker-runbook.md`
- Session commands: `/start-session`, `/end-session`
- Obsidian daily notes: `human/daily/YYYY-MM-DD.md` in `lofi-monk` vault (at `D:\openclaw\charlie\lofi-monk`)

## Architecture Notes
- **ADRs**: `docs/adr/`
- **Context index**: `.automaker/context/context-index.md`
- **BitTorrent DHT research**: `.automaker/context/bittorrent-dht-research.md`
- **AutoMaker runbook**: `.claude/notes/automaker-runbook.md`
- **Roadmap**: `.automaker/context/roadmap.md`
- **ADR-0002**: Hyperbee for metadata storage — do not re-propose SQLite
- **SHA1-as-info_hash**: intentional. File SHA1 used as DHT info_hash — NOT standard BEP 3.
- **bdecode on raw Uint8Array**: intentional. `TextDecoder('latin1')` corrupts 0x80–0x9F.
- **Dual timer in fetchFromPeer**: intentional. Prevents adversarial peer holding connection.

## Observations
- **Myrient shutdown: 2026-03-31** — 13 days. P2P layers are critical.
- **Crayon map** — Lofi asked for a plain-English explanation of what the app does today. Offer this when there's a natural pause in the work.
- AutoMaker agents don't measure coverage unless told to run `npm test -- --coverage`. Always specify in card descriptions.
- Commit locally between agent cards — don't hold uncommitted changes across multiple cards.
- `AGENTS.md` is the shared context for all agents. Keep it current.
- `gh-pr-review` extension works well — use it every PR cycle for Devin thread management.
