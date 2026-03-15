## Context

The curator pipeline (Milestones 03–04b) can identify missing ROMs by comparing a mounted library against a DAT wishlist, but has no acquisition path. Milestone 05 introduces `mesh fetch <sha1>` — a command that resolves a ROM using three escalating P2P layers and streams the result into a mounted library's `stage/` directory.

All logic must run in the Bare runtime (no DOM, no Node-only APIs). The existing `runtime.ts` (`getFetch()`, `getFs()`, `getPath()`) and the CLI command structure from Milestone 04a define the integration points.

## Goals / Non-Goals

**Goals:**
- Implement a `FetchManager` that sequences three P2P layers (Hyperswarm → IPFS → BitTorrent DHT) by SHA1
- Implement `mesh fetch <sha1>` CLI command with real-time progress bar
- Stream fetched bytes to `stage/<name>` inside the active mounted library
- Add SHA1 lookup to `dat-parser.ts` so the command can validate the target before downloading
- Remain Bare-compatible throughout

**Non-Goals:**
- Automatic retry / resume of partial downloads (deferred to Milestone 06)
- Seeding / announcing — this milestone is receive-only
- Multi-file (multi-disc) fetch in a single invocation
- Verification / sanctification of staged files (Milestone 06)

## Decisions

### D1: Three-layer sequential fallback, not parallel race

**Decision**: Try layers in order: Hyperswarm first, then IPFS, then BitTorrent DHT. Move to the next layer only on timeout or error.

**Rationale**: Hyperswarm peers share our signed DAT trust model and are the fastest path. IPFS gateways are reliable but centralised. BitTorrent DHT is broadest but slowest. Sequential ordering keeps bandwidth predictable and avoids wasting DHT slots when Hyperswarm succeeds.

**Alternative considered**: Parallel race (fire all three, take first result). Rejected — wasted connections and no clear cancellation path in Bare.

---

### D2: SHA1 as the canonical fetch key

**Decision**: `mesh fetch` accepts only the full 40-char SHA1. The DAT Hyperbee is indexed by SHA1.

**Rationale**: SHA1 is the identity used by No-Intro DATs and is the natural join key across all three P2P protocols. CRC32 or MD5 would require additional index lookups.

**Alternative considered**: Accept game name as input and resolve to SHA1 internally. Rejected — ambiguous (multiple regions/revisions), deferred to a future `mesh search | mesh fetch` pipe pattern.

---

### D3: Hyperswarm topic = SHA1 (raw 20-byte Buffer from hex)

**Decision**: Derive the Hyperswarm topic by converting the 40-char hex SHA1 to a 20-byte Buffer (`Buffer.from(sha1, 'hex')`).

**Rationale**: SHA1 is exactly 20 bytes — a natural fit for Hyperswarm's 32-byte topic. We zero-pad the remaining 12 bytes. This avoids any hashing step and makes the topic deterministic and reproducible by any peer with the DAT.

**Alternative considered**: Hash the SHA1 string with BLAKE2b to produce 32 bytes. Rejected — unnecessary indirection; peers must agree on derivation without coordination.

---

### D4: IPFS via public gateway HTTP fetch, no local node

**Decision**: Resolve SHA1 → CID using a bundled "Museum Map" JSON index (a curated mapping file), then fetch from a public IPFS HTTP gateway using `getFetch()`.

**Rationale**: Running a local IPFS node in Bare is impractical. Public gateways (e.g., `https://ipfs.io/ipfs/<CID>`) work with plain HTTP. The Museum Map is a small, versionable artifact — it can be updated independently.

**Alternative considered**: DHT-based CID resolution. Rejected — requires a full IPFS client in Bare scope.

---

### D5: BitTorrent DHT via `bittorrent-dht` npm package

**Decision**: Use the `bittorrent-dht` package for DHT peer lookup using SHA1 as infohash. Stream torrent pieces using `simple-get` or the native fetch layer.

**Rationale**: `bittorrent-dht` is a lightweight pure-JS DHT client that does not require a native module. It works in Bare with the `getFetch()` shim for HTTP-based piece fetching.

**Alternative considered**: `webtorrent` — too heavy, requires browser/WebRTC surface; incompatible with Bare.

---

### D6: FetchManager as a plain class, not a singleton

**Decision**: `FetchManager` is instantiated per `mesh fetch` invocation; it is not a module-level singleton.

**Rationale**: Each fetch is independent. A singleton would require reset logic and complicate testing. Aligns with the factory pattern used in `hub.ts` (Milestone 04b standard).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Hyperswarm peers may not be online for rare ROMs | Automatic fallback to IPFS layer |
| Museum Map CID index may be stale or incomplete | Log a warning and fall through to BitTorrent layer |
| BitTorrent DHT lookup can take 30–60 s for cold peers | Configurable timeout per layer (default: 30 s); bail and surface error |
| `bittorrent-dht` may have Bare incompatibilities | Isolate in `layers/bittorrent.ts`; integration-test in Bare before merge |
| SHA1 is cryptographically weak | SHA1 here is a content identifier from DAT files, not a security hash; no collision risk in this use case |

## Migration Plan

1. Merge Milestone 04b (runtime utilities) before starting this milestone — `getFetch()`, `getFs()`, `getPath()` must exist.
2. Add `dat-parser` SHA1 lookup method (non-breaking — additive only).
3. Implement `src/fetch/` module with unit tests for each layer (mock network).
4. Wire `src/cli/commands/fetch.ts` into the CLI dispatcher in `index.js`.
5. Integration test: seed a test ROM via Hyperswarm in a separate Pear process; verify `mesh fetch` retrieves and stages it.

## Open Questions

- **Museum Map format & hosting**: Where is the authoritative SHA1 → CID map stored? Bundled JSON in-repo for now, or fetched from a known Hyperdrive key?
- **Piece assembly for BitTorrent**: Does `bittorrent-dht` supply piece URLs, or do we need a lightweight torrent client? Needs a spike before task breakdown is final.
- **Progress granularity**: Can we get byte-level progress from all three layers, or only from the streaming fetch (IPFS/BT)? Hyperswarm streams are raw — progress may be chunk-counted.
