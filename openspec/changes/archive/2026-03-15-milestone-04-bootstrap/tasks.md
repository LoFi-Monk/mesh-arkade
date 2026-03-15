# Tasks: Curation Milestone 1 - The Bootstrap

## 🏗️ Architecture & Storage

- [x] Add `bare-sqlite` to `package.json` dependencies.
- [x] Implement `src/core/database.ts` to manage the SQLite connection and schema migrations.
- [x] Create `wishlist` and `systems` tables in the `~/.mesh-arkade/wishlist.db`.

## 🌀 Curation Core

- [x] Implement `src/core/curation.ts` with the `CurationManager` class.
- [x] Implement `seedSystem(system)`:
  - [x] `fetch` DAT from GitHub.
  - [x] Stream-parse XML to extract game metadata.
  - [x] Perform batch upsert into SQLite.
- [x] Implement `searchWishlist(query)`:
  - [x] SQLite `LIKE` query on titles.
  - [x] Limit results and format for CLI display.

## ⌨️ CLI Integration

- [x] Update `src/core/hub.ts` to include `curation:seed` and `curation:search` handlers.
- [x] Update `index.js` to handle:
  - [x] `mesh init --seed <system>`
  - [x] `mesh search <query>`
- [x] Add ASCII progress bar during the "Seeding" phase.

## 🧪 Verification & Testing

- [x] Add unit tests in `src/core/__tests__/curation.test.ts`.
- [x] Mock GitHub response for DAT fetching.
- [ ] Verify SQLite persistence and search accuracy.
- [ ] **End-to-End Test**: Run `mesh init --seed nes` in `E:\mesh_arkade_dev` and verify results.
