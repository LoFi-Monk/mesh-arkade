# Tasks: Milestone 04 - Hyperbee Transition + Dynamic Crawling

## 1. Dependencies & Foundation

- [x] 1.1 Install dependencies: `npm install hypercore hyperbee` (ensure no 404s).
- [x] 1.2 Update `package.json` and `package-lock.json`.

## 2. Storage Layer (database.ts)

- [x] 2.1 Remove `bare-sqlite` imports and logic.
- [x] 2.2 Initialize `Corestore` and `Hyperbee` in `getDatabase()`.
- [x] 2.3 Implement `bee.sub('systems')` and `bee.sub('wishlist')` namespaces.
- [x] 2.4 Implement `upsertSystem` and `insertWishlistBatch` using bee batches.
- [x] 2.5 Ensure `teardown` logic closes the database correctly.

## 3. Dynamic Crawler (curation.ts)

- [x] 3.1 Remove hardcoded `SYSTEM_DEFINITIONS`.
- [x] 3.2 Implement `fetchSystems()` to query GitHub API (`libretro/libretro-database/contents/dat`).
- [x] 3.3 Map API results to internal IDs and store in the `systems` namespace.
- [x] 3.4 Handle GitHub API rate limits with simple 24h caching in `app.storage`.

## 4. Seeding & Search Logic

- [x] 4.1 Update `seedSystem` to fetch systems dynamically if not present.
- [x] 4.2 Update `seedSystem` to use the new Hyperbee batching API.
- [x] 4.3 Update `searchWishlist` to query the `wishlist` namespace via `bee.createReadStream`.

## 5. Verification & Testing

- [x] 5.1 Update `src/core/__tests__/curation.test.ts` to use `ram` (random-access-memory) for Hypercore tests.
- [x] 5.2 Remove all hallucinated `bare-sqlite` mocks.
- [x] 5.3 Verify `mesh init --seed nes` works with real GitHub data (E2E).
- [x] 5.4 Verify `mesh search` returns correct results from the local store.
