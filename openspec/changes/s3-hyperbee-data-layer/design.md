## Context

E004 stories S1 (fetch), S1c (system index), and S2 (parser) are complete. The pipeline produces `DatFile` objects in memory with no persistence. S3 bridges the gap: parsed DAT data goes into Hyperbee and stays there across restarts.

The key schema was stress-tested against all three verification scenarios and locked in ADR-0011. ADR-0012 confirms Hyperbee as the single source of truth for DAT data. DeepWiki research confirmed Corestore is CI-verified Bare-compatible and Hyperbee uses all Holepunch-native dependencies.

Current codebase: `src/dat/` handles fetch/parse, `src/core/` has logger and runtime. S3 adds `src/store/` as a new module boundary — no changes to existing modules.

## Goals / Non-Goals

**Goals:**
- Persistent DAT storage via Hyperbee with the locked quad-hash key schema
- O(1) ROM lookup by any hash type (SHA1, MD5, CRC32, SHA256) with fallback chain
- Atomic per-system management keys (no array read-modify-write)
- Prefix scans to enumerate all entries for a system
- Bare + Node compatible (Corestore storage path adapts to runtime)
- Hand-written TypeScript declarations for Hyperbee and Corestore
- Full TDD: store lifecycle, write/read round-trip, hash fallback, prefix scan, system management

**Non-Goals:**
- P2P replication (future — Hyperbee supports it, but wiring to Hyperswarm is not in scope)
- ROM verification logic (S4 — this story only provides the lookup primitive)
- CLI commands for list/export (future CLI epic — ADR-0012 notes these as consequences)
- Streaming/batch write optimization (write entries sequentially; optimize if benchmarks show need)
- `systems:index` migration into Hyperbee (S1c's index is fetched from GitHub at runtime — separate concern)

## Decisions

### 1. Module structure: `src/store/` with separated concerns

**Choice:** Split into `store.ts` (lifecycle), `dat-store.ts` (write), `dat-lookup.ts` (read), `systems.ts` (managed systems), `types.ts` (store types).

**Why:** Single Responsibility. The store lifecycle (open/close Corestore + Hyperbee) is distinct from DAT write logic, which is distinct from lookup logic. Separating them allows S4 to import only `dat-lookup` without pulling in write dependencies.

**Alternative:** Single `store.ts` file. Rejected — it would grow large and mix concerns.

### 2. Storage path: `Pear.config.storage` in production, temp directory in tests

**Choice:** `createStore(storagePath?: string)` accepts an optional path. Defaults to `Pear.config.storage` when running in Pear, requires explicit path in tests.

**Why:** Corestore just takes a string path. The Pear runtime provides `Pear.config.storage` as the sandboxed app directory. Tests pass a temp directory that gets cleaned up. Runtime detection via `typeof Pear !== 'undefined'`.

**Alternative:** Always require explicit path. Rejected — production callers shouldn't need to know about Pear internals.

### 3. Prefix scans via `db.sub()`, not range queries

**Choice:** Use Hyperbee's `sub(prefix)` API to create scoped sub-bees for prefix queries rather than manually constructing `gte`/`lt` range boundaries.

**Why:** `db.sub('dat').sub(systemName)` is idiomatic Hyperbee and handles separator encoding correctly. Manual range queries with string boundaries are error-prone (what comes after the last valid character?).

### 4. Hash normalization on both write and read paths

**Choice:** Uppercase all hash values before writing to Hyperbee keys AND before lookup queries.

**Why:** The S2 parser already normalizes to uppercase on parse. But hashes from external sources (file scanners, user input) may arrive in lowercase. Normalizing on both paths guarantees match regardless of input casing.

### 5. `DatRom.serial` stored in value, not indexed as key

**Choice:** Include `serial` in the stored value object alongside other ROM metadata, but do not create a `dat:<system>:serial:<value>` key.

**Why:** Serial is metadata, not a verification hash. No current lookup scenario needs serial-based access. Storing it preserves the data for future use without adding unnecessary key proliferation. Can be indexed later if a use case emerges.

### 6. Store lifecycle: explicit open/close with ready guard

**Choice:** `createStore()` returns a store object. Callers must `await store.ready()` before use and `await store.close()` when done. The store object holds both the Corestore and Hyperbee instances.

**Why:** Hyperbee and Corestore both require async initialization. An explicit lifecycle prevents use-before-ready bugs. `store.close()` propagates to Corestore which closes all sessions.

### 7. Encoding: JSON value encoding, UTF-8 string keys

**Choice:** Hyperbee configured with `keyEncoding: 'utf-8'` and `valueEncoding: 'json'`.

**Why:** Keys are human-readable strings (system names, hash hex). Values are structured objects (game metadata, ROM data). JSON encoding handles serialization automatically and is inspectable for debugging.

## Risks / Trade-offs

**[Performance with large DAT sets]** → PlayStation DAT has ~1,800 entries × 3-4 hash keys each = ~5,400-7,200 Hyperbee puts per system. Mitigation: benchmark during implementation. Hyperbee batch API is available if sequential puts are too slow.

**[No TypeScript types ship with packages]** → Hand-written `.d.ts` files may drift from actual API. Mitigation: type declarations cover only the methods we use. Tests exercise every declared method, catching drift early.

**[Bare compatibility unverified empirically]** → DeepWiki research is high-confidence but we haven't run Hyperbee under Bare yet. Mitigation: first implementation task is a smoke test — install, put, get, verify under both Node and Bare. Fail fast before writing real logic.

**[Key length with canonical system names]** → Keys like `dat:Nintendo - Nintendo Entertainment System:sha1:ABC123` are verbose. Mitigation: Hyperbee doesn't penalize key length meaningfully. B-tree pages handle variable-length keys. Correctness over ergonomics.

## Open Questions

None — all design questions resolved during schema stress-test and DeepWiki research. Remaining unknowns (Bare smoke test, batch write performance) are implementation-time validations, not design blockers.
