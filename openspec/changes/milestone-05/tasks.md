## 1. Prerequisites & Setup

- [ ] 1.1 Verify Milestone 04b (`runtime.ts`, `paths.ts`) is merged; confirm `getFetch()`, `getFs()`, `getPath()` are importable
- [ ] 1.2 Add `bittorrent-dht` to `package.json` dependencies and verify it resolves in Bare runtime
- [ ] 1.3 Create directory structure: `src/fetch/layers/` and `src/fetch/errors.ts`

## 2. DAT Parser — SHA1 Lookup

- [ ] 2.1 Add `resolveByShortSha1(records: GameRecord[], sha1: string): GameRecord | null` to `src/core/dat-parser.ts`
- [ ] 2.2 Write unit tests for `resolveByShortSha1` (match, no-match, case-insensitive)

## 3. Error Types

- [ ] 3.1 Create `src/fetch/errors.ts` exporting `FetchLayerTimeoutError`, `FetchLayerError`, and `AllLayersFailedError`

## 4. Museum Map

- [ ] 4.1 Create `src/fetch/museum-map.json` as an initial (possibly empty) SHA1 → CID mapping file with a documented schema comment
- [ ] 4.2 Create `src/fetch/museum-map.ts` exporting `lookupCid(sha1: string): string | null` using the JSON index

## 5. Hyperswarm Fetch Layer

- [ ] 5.1 Implement `src/fetch/layers/hyperswarm.ts` — derive topic from SHA1, join swarm, stream bytes from first peer
- [ ] 5.2 Implement configurable timeout (default 30 s) with clean swarm shutdown on timeout
- [ ] 5.3 Write unit tests for Hyperswarm layer with a mock Hyperswarm peer (success and timeout cases)

## 6. IPFS Gateway Fetch Layer

- [ ] 6.1 Implement `src/fetch/layers/ipfs.ts` — look up SHA1 in Museum Map, fetch CID from public gateway via `getFetch()`
- [ ] 6.2 Handle `not-in-museum-map` and non-200 gateway response error cases
- [ ] 6.3 Write unit tests for IPFS layer (map hit + 200, map miss, gateway error)

## 7. BitTorrent DHT Fetch Layer

- [ ] 7.1 Spike `bittorrent-dht` in a Bare process to confirm DHT lookup works with SHA1 as infohash
- [ ] 7.2 Implement `src/fetch/layers/bittorrent.ts` — DHT peer lookup, piece retrieval, assembly
- [ ] 7.3 Implement configurable timeout (default 30 s) with clean DHT shutdown
- [ ] 7.4 Write unit tests for BitTorrent layer with mock DHT (success and timeout cases)

## 8. FetchManager

- [ ] 8.1 Implement `src/fetch/fetch-manager.ts` — sequential layer orchestration (Hyperswarm → IPFS → DHT)
- [ ] 8.2 Implement `onProgress(callback)` with progress reset on layer fallback
- [ ] 8.3 Implement `fetch(sha1, destDir)` — resolve filename from DAT record or default to `<sha1>.bin`, write via `getFs()`
- [ ] 8.4 Write unit tests for FetchManager: Hyperswarm success, Hyperswarm-fail/IPFS-success, all-fail aggregation

## 9. CLI Command

- [ ] 9.1 Create `src/cli/commands/fetch.ts` exporting `handleFetch(args, hub)`
- [ ] 9.2 Implement SHA1 argument validation (40 hex chars, case-insensitive)
- [ ] 9.3 Implement mounted-library check and `stage/` path resolution from `hub`
- [ ] 9.4 Wire `FetchManager` with real-time progress bar rendering
- [ ] 9.5 Print success (`Staged: <filename>`) or failure summary with per-layer error details
- [ ] 9.6 Register `fetch` command in `index.js` CLI dispatcher
- [ ] 9.7 Write unit tests for `handleFetch`: valid SHA1 + library, invalid SHA1, no library mounted

## 10. Integration Test

- [ ] 10.1 Write an integration test that seeds a small test ROM via Hyperswarm in a child Pear process and verifies `mesh fetch` retrieves and stages it correctly
- [ ] 10.2 Verify the full fallback chain in a controlled environment (mock Hyperswarm failure → IPFS success)

## 11. Documentation & Cleanup

- [ ] 11.1 Add TSDoc to all public exports in `src/fetch/` following the Intent → Guarantees → Constraints/Warnings convention
- [ ] 11.2 Update `README.md` (or relevant CLI help text) with `mesh fetch <sha1>` usage and example
- [ ] 11.3 Update roadmap entry `[05]` status to `Completed ✓`
