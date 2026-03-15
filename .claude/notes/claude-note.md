# Claude Notes (MeshARKade)

## Status
Milestone 04a complete and merged (PR #5). Devin review cycle finished — all threads resolved. Session focused on building `scripts/devin-review.sh` and establishing start/end session workflow.

## Current Branch
`main` — clean, up to date with remote.

## In Progress
Nothing. Clean slate for next session.

## Deferred Items
- Hub `stop()` should close Hyperbee/Corestore (resource leak) — refactor PR
- `getSystemDefinition` loose `.includes()` matching — refactor PR
- Dead `askQuestion` function cleanup — index.js refactor PR
- `drawProgressBar` unused — wire up in milestone-05
- CLI test mocks use `as any` — tighten to typed stubs post-milestone-05

## Tooling
- `scripts/devin-review.sh` — automates Devin review cycles
  - Subcommands: `fetch [PR]`, `reply <comment_id> <body_file> <pr>`, `resolve [PR]`
  - GraphQL-only fetch (no REST+join), backtick-safe replies via `--input`
  - Requires `jq` (installed via winget — restart terminal for PATH to pick it up)
  - Devin's GraphQL login: `devin-ai-integration` (no `[bot]` suffix)
- Session commands: `/start-session`, `/end-session` in `.claude/commands/`

## Architecture Notes
- ADRs: `.agent/adr/`
- OpenSpecs: `openspec/specs/`
- ADR-0002: Hyperbee for metadata storage (Bare-friendly, P2P portable)
- Roadmap: `.agent/roadmap.md`

## Observations
- Game Gear and Master System alias fix is in place (`SYSTEM_ALIASES`) but can't be end-to-end tested — they're not in the Libretro systems list yet
- Some system IDs have a leading dash oddity (e.g. `- playstation 3`) — future cleanup pass
- Region detection returns "Unknown" for many entries — parser could be smarter about title parentheticals
