# ADR-0014 — Strict Binary Verification (Verified vs. Unknown)

**Status:** Accepted
**Date:** 2026-03-26

## Context and Problem Statement
To achieve O(1) lookups in our Hyperbee database, we index by the ROM's hash (SHA1/CRC32). Distinguishing between a "bad dump" (size matches, hash misses) and an "unrecognized file" (both miss) would require secondary indexes or linear scanning. We need a clear philosophy on how to handle unrecognized files.

## Decision Drivers
- Hyperbee O(1) lookups index by hash, making secondary lookups (by size) inefficient.
- Preservation culture (No-Intro/Redump) treats any unverified dump as suspect.
- System simplicity and maintenance.
- Mesh-ARKade is a museum-quality project. Only pristine ROMs are accepted.

## Decision
We drop the "bad dump" classification. A ROM is either strictly **Verified** (exact hash match) or **Unknown**. If a game is unverified (Unknown), it does not make it into the swarm.

Homebrew games and other existing collections with DATs (including libretro) can be verified if their hashes are present in the DAT. "Unknown" simply means it didn't match our known DATs.

## Consequences
- **Positive:** Guarantees O(1) performance for lookups.
- **Positive:** Keeps the database schema incredibly lean.
- **Positive:** Aligns perfectly with the zero-trust museum preservation philosophy.
- **Negative:** Users with slightly modified ROMs or unknown translations will get a generic "Unknown" result instead of specific "Bad dump" feedback. This is an acceptable tradeoff for preserving the archival integrity of the swarm.