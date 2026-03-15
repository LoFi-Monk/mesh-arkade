## 1. Prerequisites & Setup

- [x] 1.1 Verify Milestone 04b (`runtime.ts`, `paths.ts`) is merged; confirm `getFetch()`, `getFs()`, `getPath()` are importable
- [x] 1.2 Add `bittorrent-dht` to `package.json` dependencies and verify it resolves in Bare runtime
- [x] 1.3 Create directory structure: `src/fetch/layers/` and `src/fetch/errors.ts`

## 2. DAT Parser — SHA1 Lookup

- [x] 2.1 Add `resolveByShortSha1(records: GameRecord[], sha1: string): GameRecord | null` to `src/core/dat-parser.ts`
- [x] 2.2 Write unit tests for `resolveByShortSha1` (match, no-match, case-insensitive)

## 3. Error Types

- [x] 3.1 Create `src/fetch/errors.ts` exporting `FetchLayerTimeoutError`, `FetchLayerError`, and `AllLayersFailedError`

## 4. Museum Map

- [x] 4.1 Create `src/fetch/museum-map.json` as an initial (possibly empty) SHA1 → CID mapping file with a documented schema comment
- [x] 4.2 Create `src/fetch/museum-map.ts` exporting `lookupCid(sha1: string): string | null` using the JSON index

## 5. Hyperswarm Fetch Layer

- [x] 5.1 Implement `src/fetch/layers/hyperswarm.ts` — derive topic from SHA1, join swarm, stream bytes from first peer
- [x] 5.2 Implement configurable timeout (default 30 s) with clean swarm shutdown on timeout
- [ ] 5.3 Write unit tests for Hyperswarm layer with a mock Hyperswarm peer (success and timeout cases)

## 6. IPFS Gateway Fetch Layer

- [x] 6.1 Implement `src/fetch/layers/ipfs.ts` — look up SHA1 in Museum Map, fetch CID from public gateway via `getFetch()`
- [x] 6.2 Handle `not-in-museum-map` and non-200 gateway response error cases
- [ ] 6.3 Write unit tests for IPFS layer (map hit + 200, map miss, gateway error)

## 7. BitTorrent DHT Fetch Layer

- [ ] 7.1 Spike `bittorrent-dht` in a Bare process to confirm DHT lookup works with SHA1 as infohash
- [x] 7.2 Implement `src/fetch/layers/bittorrent.ts` — DHT peer lookup, piece retrieval, assembly
- [x] 7.3 Implement configurable timeout (default 30 s) with clean DHT shutdown
- [ ] 7.4 Write unit tests for BitTorrent layer with mock DHT (success and timeout cases)

## 8. FetchManager

- [x] 8.1 Implement `src/fetch/fetch-manager.ts` — sequential layer orchestration (Hyperswarm → IPFS → DHT)
- [x] 8.2 Implement `onProgress(callback)` with progress reset on layer fallback
- [x] 8.3 Implement `fetch(sha1, destDir)` — resolve filename from DAT record or default to `<sha1>.bin`, write via `getFs()`
- [ ] 8.4 Write unit tests for FetchManager: Hyperswarm success, Hyperswarm-fail/IPFS-success, all-fail aggregation

## 9. CLI Command

- [x] 9.1 Create `src/cli/commands/fetch.ts` exporting `handleFetch(args, hub)`
- [x] 9.2 Implement SHA1 argument validation (40 hex chars, case-insensitive)
- [x] 9.3 Implement mounted-library check and `stage/` path resolution from `hub`
- [x] 9.4 Wire `FetchManager` with real-time progress bar rendering
- [x] 9.5 Print success (`Staged: <filename>`) or failure summary with per-layer error details
- [x] 9.6 Register `fetch` command in `index.js` CLI dispatcher
- [ ] 9.7 Write unit tests for `handleFetch`: valid SHA1 + library, invalid SHA1, no library mounted

## 10. Integration Test

- [ ] 10.1 Write an integration test that seeds a small test ROM via Hyperswarm in a child Pear process and verifies `mesh fetch` retrieves and stages it correctly
- [ ] 10.2 Verify the full fallback chain in a controlled environment (mock Hyperswarm failure → IPFS success)

## 11. Documentation & Cleanup

- [x] 11.1 Add TSDoc to all public exports in `src/fetch/` following the Intent → Guarantees → Constraints/Warnings convention
- [ ] 11.2 Update `README.md` (or relevant CLI help text) with `mesh fetch <sha1>` usage and example
- [ ] 11.3 Update roadmap entry `[05]` status to `Completed ✓`

## 12. DAT Trust & Bootstrap Verification

- [x] 12.1 Define a `TrustedSource` interface in `src/fetch/trust.ts` with fields: `url`, `publicKey` (optional), `description`
- [x] 12.2 Hardcode a `TRUSTED_DAT_SOURCES` constant listing known-good No-Intro DAT endpoints (e.g. Libretro GitHub mirror) with their expected content hashes
- [x] 12.3 Implement `fetchVerifiedDat(systemId: string): Promise<Buffer>` — fetch DAT from trusted source, verify content hash matches expected value before returning
- [ ] 12.4 On first-run DAT bootstrap (`mesh init --seed`), route through `fetchVerifiedDat` instead of raw fetch — reject and warn if hash mismatch
- [ ] 12.5 Implement content-addressed pinning: after a DAT is verified, announce its SHA1 hash on Hyperswarm so future peers can retrieve it from the swarm instead of the origin
- [ ] 12.6 Write unit tests for `fetchVerifiedDat`: hash match (accept), hash mismatch (reject), network error
- [ ] 12.7 Document the trust model in `openspec/changes/milestone-05/specs/dat-trust/spec.md`
