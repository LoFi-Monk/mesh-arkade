# Claude Notes (MeshARKade)

## Status
Milestone 05 complete. This session retired OpenSpec entirely and migrated the project to AutoMaker. Next session: triage the AutoMaker feature board together.

## Current Branch
`main` — 2 commits ahead of origin, not pushed.

## In Progress
**AutoMaker feature board triage** — AutoMaker generated ~100+ feature cards from the app spec. They need to be sorted together: Phase 1 (M06 / carry-forwards) vs noise / backlog. Do this as a team before any implementation starts.

## Deferred Items
- Hub `stop()` should close Hyperbee/Corestore (resource leak) — refactor PR
- `getSystemDefinition` loose `.includes()` matching — refactor PR
- Dead `askQuestion` function cleanup — index.js refactor PR
- CLI test mocks use `as any` — tighten to typed stubs post-milestone-05
- **M05 test coverage debt** (carry-forward — must address during M06):
  - `5.3` Hyperswarm layer: mock peer success + timeout cases
  - `6.3` IPFS layer: map hit + 200, map miss, gateway error
  - `7.4` BitTorrent layer: mock DHT success + timeout cases
  - `8.4` FetchManager: Hyperswarm success, fallback to IPFS, all-fail aggregation
  - `9.7` `handleFetch` CLI: valid SHA1 + library, invalid SHA1, no library mounted
  - `12.6` `fetchVerifiedDat`: hash match (accept), mismatch (reject), network error
- **BitTorrent DHT spike** (task 7.1 — blocker for M06): spike `bittorrent-dht` in a Bare process, confirm DHT lookup with SHA1 as infohash
- **Trust & security hardening** (future milestone): tasks 12.4 and 12.5

## Tooling
- `scripts/devin-review.sh` — automates Devin review cycles
  - Subcommands: `fetch [PR]`, `reply <comment_id> <body_file> <pr>`, `resolve [PR]`
  - GraphQL-only fetch (no REST+join), backtick-safe replies via `--input`
  - Requires `jq` (installed via winget — restart terminal for PATH to pick it up)
  - Devin's GraphQL login: `devin-ai-integration` (no `[bot]` suffix)
- Session commands: `/start-session`, `/end-session` in `.claude/commands/`
- AutoMaker: `:3008` (Express API), `:3007` (Electron UI). Auth: `X-API-Key` from `C:/ag-workspace/automaker/data/.api-key`
- Obsidian CLI skill added: `.claude/skills/obsidian-cli/SKILL.md` — use `--help` flag for live reference

## Architecture Notes
- **ADRs**: `docs/adr/` (moved from `.agent/adr/` — OpenSpec is retired)
- **OpenSpecs**: RETIRED — `openspec/` and `.agent/` deleted. AutoMaker feature board is the new tracking system.
- **Context index**: `.automaker/context/context-index.md` — phonebook for agents. Points to ADRs and all Holepunch module README links.
- **Roadmap**: `.automaker/context/roadmap.md`
- **ADR-0002**: Hyperbee for metadata storage (Bare-friendly, P2P portable) — do not re-propose SQLite
- **Singleton CoreHub**: Valid pattern for single-process Pear/Bare apps — not an antipattern here
- `docs.pears.com` lags reality — use `https://github.com/holepunchto/pear-docs` for platform docs, individual module READMEs for API details

## Observations
- Game Gear and Master System alias fix is in place (`SYSTEM_ALIASES`) but can't be end-to-end tested — not in the Libretro systems list yet
- Some system IDs have a leading dash oddity (e.g. `- playstation 3`) — future cleanup pass
- Region detection returns "Unknown" for many entries — parser could be smarter about title parentheticals
- AutoMaker generated ~100 feature cards; many are noise (GUI features, wishlist features, emulation). Needs a triage pass to identify true M06 scope vs long-term backlog.
- `bare-crypto` correct repo is `github.com/holepunchto/bare-crypto` (context-index had wrong link — now fixed)
