## Context

Mesh-ARKade has working DAT ingestion (CORE-003): parse ClrMamePro DATs, fetch from libretro GitHub, store in Hyperbee with quad-hash indexing, verify ROMs against cached entries. But these modules are raw building blocks — no service boundary, no metadata enrichment, no CLI beyond a 17-line Pear bootstrap.

The ARKive Service Layer is the first service boundary in the app. It wraps existing modules behind a facade and adds the merge pipeline that turns raw DAT entries into enriched catalog records. This is a NES vertical slice — one system end-to-end before generalizing.

Constraints:
- Bare runtime compatible (no DOM, no Node-only APIs without aliases)
- No HTTP servers — P2P only (Holepunch stack)
- Existing Hyperbee storage pattern (sub-indexes via `bee.sub()`)
- ADR-0016: raw DAT XML cached at `~/mesh-arkade/DATs/`

## Goals / Non-Goals

**Goals:**
- Wrap existing CORE-003 modules behind `ArkiveService` — CLI/UI never touch Hyperbee directly
- Fetch and merge main NES DAT + 5 supplementary metadata DATs into enriched entries
- Provide search and browse methods for the NES catalog
- Bootstrap `~/mesh-arkade/` App Root on first run
- Wire into CLI entry point with basic commands
- Define `ProfileService` interface so collection-gated methods have a typed contract

**Non-Goals:**
- ProfileService implementation (CORE-008)
- Collection management, ROM scanning, Virtual Mirror (CORE-009)
- Multi-system support beyond NES (future generalization)
- Media/thumbnail pipeline (CORE-010)
- Swarm seeding or IPFS fallback (CORE-011, CORE-012)
- CLI framework adoption (raw `process.argv` for v1)
- Slug-based keys (CRC is the internal key)

## Decisions

### 1. Service Boundary Pattern — Facade wrapping existing modules

ArkiveService is a facade, not a rewrite. It composes `fetchDat()`, `parseDat()`, `storeDat()`, and `verifyRom()` internally and exposes catalog operations.

**Why:** Existing modules are tested and working. The service layer adds orchestration and enrichment without duplicating logic.

**Alternative considered:** Rewriting store/fetch into service methods directly — rejected because it would duplicate tested code and create maintenance burden.

### 2. Merge Strategy — Normalized game name as join key, last-write-wins per field

Main DAT provides `gameName`, `romName`, `size`, `crc`, `md5`, `sha1`, `sha256`. Supplementary DATs provide one field each (developer, genre, releaseyear, releasemonth, publisher). Merge joins on normalized game name (strip all trailing parenthetical groups, convert to lowercase).

**Why:** Libretro's `metadat/` DATs don't contain CRC values — they use the `comment` field with the game name. CRC-based joining isn't possible. Normalized game name is the only identifier available.

**Alternative considered:** CRC-based matching — rejected because supplementary DATs don't contain CRC. The libretro metadat files use `comment` as the game identifier.

### 3. Region Parsing — Allowlist extraction from game name string

Parse region from parenthetical tokens in the game name: `(USA)`, `(Europe)`, `(Japan)`, etc. Multi-region entries comma-separated. Unknown regions → `region: null` (self-annealing: corrected on next DAT refresh if data improves).

**Why:** NES DATs have no explicit `region` field. Name-embedded region is the only source. Allowlist prevents false positives from non-region parenthetical content.

**Alternative considered:** Regex matching all parenthetical content — rejected because it would capture non-region data like `(Rev A)`, `(Unl)`.

### 4. ProfileService — Sibling service, injected at construction

`ArkiveService` accepts an optional `ProfileService` via constructor. When absent, collection methods throw `ProfileRequiredError`. Browse/search methods work without a profile.

**Why:** Clean separation of concerns. Profile logic (keypair identity, ratio, trust) lives in its own service. ARKive doesn't need to know profile internals — just whether one exists.

**Alternative considered:** Profile as middleware/guard — rejected because it would couple auth logic to every method call.

### 5. Hyperbee Key Structure — Compound keys with system namespace

Keys: `nes/crc:<CRC>` for entries, `nes/name:<normalized>` for name index. System prefix enables future multi-system support without key collisions.

**Why:** `bee.sub('nes')` gives us a natural namespace boundary. Name index is a separate sub-index mapping normalized names to CRC values for search.

### 6. App Root — `~/mesh-arkade/` via `os.homedir()`

Created on first run. Contains `config.json` (app settings, collection registry placeholder) and `DATs/` (raw XML cache per ADR-0016). Idempotent — subsequent runs detect and skip.

**Why:** ADR-0016 established this path. `os.homedir()` works via `bare-node-os` alias.

### 7. CLI Routing — Raw `process.argv` parsing

No CLI framework. Parse `process.argv[2]` as command, remaining args as parameters. Commands: `catalog`, `search <query>`, `info <name>`.

**Why:** Simplest approach that works in Bare runtime. CLI frameworks add weight and may have Node-only dependencies. Upgrade path exists when command count grows.

## Risks / Trade-offs

- **Supplementary DAT availability** → If a metadat file is missing or empty, the merge pipeline must handle gracefully (skip, log warning). Not all games will have all enrichment fields — fields remain `undefined`.
- **CRC collision** → Theoretically possible but practically negligible for NES ROMs. If it occurs, last-write-wins means one entry gets overwritten. Acceptable for v1.
- **Region parsing false negatives** → Games with non-standard region formats will get `region: null`. Self-annealing: on next DAT refresh, new patterns can be added to the allowlist.
- **Name index staleness** → Name index must be rebuilt when the main DAT is re-fetched. The merge pipeline handles this as part of `refreshCatalog()`.
- **`os.homedir()` on Bare** → Works via `bare-node-os` alias (already in `package.json`), but should be tested on actual Bare runtime. Fallback: environment variable.
