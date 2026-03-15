## Why

The curator can identify what ROMs a library is missing, but has no way to acquire them. Milestone 05 closes this gap by implementing `mesh fetch` — a command that resolves a ROM by SHA1 hash using a Triple-Layer P2P discovery stack (Hyperswarm → IPFS → BitTorrent DHT), enabling "from zero" library bootstrapping without any centralised server.

## What Changes

- New `mesh fetch <sha1>` CLI command that streams a matched ROM file into a mounted library's `stage/` directory
- Hyperswarm topic-based peer discovery using SHA1 as the topic key
- IPFS fallback via a "Museum Map" index that resolves SHA1 → CID for gateway fetch
- BitTorrent DHT fallback using SHA1 as infohash for public DHT lookup
- `FetchManager` abstraction that orchestrates the three layers with a progress bar
- Integration with the existing `src/cli/commands/` structure from Milestone 04a

## Capabilities

### New Capabilities

- `p2p-fetch`: Triple-layer P2P discovery and streaming fetch by SHA1 (Hyperswarm → IPFS → BitTorrent DHT), writing output to `stage/` in a mounted library
- `fetch-manager`: Orchestrator that sequences the three fetch layers, reports progress, and surfaces errors cleanly to the CLI

### Modified Capabilities

- `dat-parser`: DAT lookup must expose a `resolveByShortSha1(sha1: string)` method so `mesh fetch` can validate the target before initiating a download

## Impact

- **New files**: `src/fetch/` module with `fetch-manager.ts`, `layers/hyperswarm.ts`, `layers/ipfs.ts`, `layers/bittorrent.ts`
- **New CLI command**: `src/cli/commands/fetch.ts`
- **Modified**: `src/core/dat-parser.ts` — add SHA1 lookup method
- **Dependencies**: `hyperswarm` (already available), `webtorrent` or `bittorrent-dht` (new), IPFS HTTP gateway (no new dep — plain fetch)
- **Bare compatibility**: All three layers must use `getFetch()` from `runtime.ts` and avoid Node-specific stream APIs where avoidable
