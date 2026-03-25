# ADR-0011 — Hyperbee as Local Data Layer

**Status:** Accepted
**Date:** 2026-03-24

## Context and Problem Statement

E004 (DAT Ingestion) needs to store parsed DAT data locally for fast ROM verification. The initial design cached raw DAT files as JSON on disk. However, the app will eventually need:

- Queryable game metadata (title, publisher, year, box art)
- User collection state (which systems, which ROMs verified)
- Verification history and peer trust data
- P2P replication of the catalog across swarm peers

A flat-file JSON cache would require migration to a proper data layer later. The question is whether to start with JSON and migrate, or go directly to the right foundation.

## Decision Drivers

- Mesh-ARKade is a Pear/Bare app — the data layer must be Pear-native
- DAT lookup must be fast — ROM verification happens on every swarm download
- The catalog should be P2P-replicable without extra infrastructure
- Avoid building something we'll throw away in 2 epics

## Considered Options

### Option 1: JSON files on disk
Cache parsed DATs as `<system>.json` in `Pear.app.storage`. Simple, no dependencies. But:
- No indexed queries — full scan to find a ROM by hash
- No replication — peers can't share the catalog
- Migration cost when we inevitably need a real store

### Option 2: SQLite / better-sqlite3
Battle-tested, queryable, great for structured data. But:
- Not Bare-compatible without native bindings
- Not P2P-replicable — centralized by nature
- Violates the Pear-native constraint

### Option 3: Hyperbee (B-tree on Hypercore)
Key-value store built on Hypercore. Sorted keys, prefix queries, persistent, P2P-replicable via Hyperswarm. Already in the Holepunch stack.

## Decision

**Option 3 — Hyperbee.**

### Key design

```
Key schema (examples):

dat:<canonical-system-name>:header         → { name, version }
dat:<canonical-system-name>:sha1:<hash>    → { gameName, romName, size, crc32, md5, sha256? }
dat:<canonical-system-name>:md5:<hash>     → { gameName, romName, size, crc32, sha1, sha256? }
dat:<canonical-system-name>:crc:<hash>     → { gameName, romName, size, md5, sha1, sha256? }
dat:<canonical-system-name>:sha256:<hash>  → { gameName, romName, size, crc32, md5, sha1 }   ← write only when present
systems:managed:<canonical-system-name>    → true
systems:index:<friendly>                   → <canonical-system-name>
```

- **Canonical system name as key prefix** — matches No-Intro/Libretro naming exactly (e.g. "Nintendo - Nintendo Entertainment System"). No slug derivation, no translation layer.
- **Quad hash keys** (SHA1 + MD5 + CRC32 + SHA256 when available) for O(1) ROM verification from any hash
- **Lookup priority**: SHA1 → MD5 → CRC32
- **SHA256** written when present in DAT — serves as IPFS CIDv1 bridge for future distribution layer
- **Prefix queries** (`dat:<canonical-system-name>:*`) to enumerate all entries for a system
- **Per-system managed keys** — `systems:managed:<name>` → `true`. Atomic single-write per system, no read-modify-write array. Listing managed systems is a prefix scan on `systems:managed:`.
- **Replication-ready** — when swarm features land, the Hyperbee can replicate to peers

### Verification scenarios this enables

| Scenario | Description | Trigger |
|----------|-------------|---------|
| Single ROM verify | Hash a ROM, look up against cached DAT | Swarm download arrives |
| Batch import | Scan a directory of ROMs, verify each | User onboards existing collection |
| Batch swarm download | Pull a system set from peers, verify all | User downloads a set from the mesh |

All three use the same core: hash → Hyperbee lookup → verified / bad dump / unknown.

On failure:
- **Swarm single**: reject ROM, flag the peer
- **Batch import**: skip, report to user
- **Batch swarm**: reject bad files, flag source peers, accept verified ones

## Consequences

### Positive
- No migration — the data layer is right from day one
- Fast hash lookups for verification (B-tree, not linear scan)
- P2P replication comes free when swarm features are built
- Metadata (box art, publisher, etc.) fits naturally as additional keys
- Peer trust/reputation data can live in the same store

### Negative
- Heavier than JSON for a first pass — more setup in S3
- Hyperbee API must be learned and tested for Bare compatibility
- Schema design is now an upfront concern (but better now than during migration)

### Risks
- Hyperbee performance with large DAT sets (PlayStation has ~1,800 entries) — needs benchmarking in S3
- Bare compatibility of Hyperbee/Corestore — verify before committing to S3 implementation
- Missing hashes are possible in older DAT entries — lookup layer must handle graceful fallback across all four hash types
