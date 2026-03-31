---
type: note
kind: adr
lifecycle: active
status: accepted
priority: medium
tags:
  - dat
  - pipeline
  - github-actions
  - consensus
  - architecture
description: Migrate DAT ingestion from libretro-database to a mesh-arkade controlled GitHub repo with a GitHub Action pipeline, SHA256 manifest verification, and a peer consensus gate before DATs are promoted to canonical.
parent:
project: "[[Mesh-ARKade]]"
created: 2026-03-31
modified: 2026-03-31
---

# ADR-0019 — DAT Pipeline: mesh-arkade Controlled Repo as Source

**Status:** Accepted (implementation deferred — Phase 4)
**Date:** 2026-03-31
**Extends:** [[adr-0007-dat-source-of-truth]]

## Context and Problem Statement

ADR-0007 established libretro-database (GitHub) as the sole DAT source — reliable, stable, no scraping. That remains correct for Phase 1. But the long-term architecture needs a mesh-arkade controlled DAT pipeline so we can:

- Control update cadence and validation before DATs reach users
- Gate DATs through hash verification before peer consensus
- Become a DAT producer, not just a consumer (ADR-0018)

## Decision

**The DAT ingestion URL will eventually point to a mesh-arkade controlled GitHub repository**, not libretro-database directly. The current fetch code (URL-based, CLRMamePro format) stays unchanged — it's just a URL swap.

**The controlled repo will have a GitHub Action** that:
1. Pulls updated DATs from upstream sources (libretro-database, No-Intro, Redump) on a schedule
2. Hashes each DAT file (SHA256)
3. Publishes a manifest of DAT filenames → hashes alongside the DAT files

**The client DAT ingestion flow becomes:**
1. Fetch DAT from mesh-arkade repo
2. Verify SHA256 against the published manifest before writing to Hyperbee
3. Hash-verified DAT enters the database as a candidate
4. Peer consensus (CORE-011 gossip network) promotes it to canonical

This gives us a verification gate at every stage: transport integrity (HTTPS), content integrity (SHA256 manifest), and community trust (peer consensus).

## Why This Matters

The current fetch code is intentionally written to support this. `mergeDat(system)` takes a system name and constructs a URL — changing the base URL is a one-line config change. No architectural rework needed.

The DAT ingestion code we have today (fetch → parse → Hyperbee) is the right foundation. The pipeline migration is additive — it doesn't replace what we built, it extends it.

## Consequences

- **Positive**: Full control over DAT quality and update cadence. Hash verification before consensus. Clean upgrade path from Phase 1 (trust libretro) to Phase 4 (trust the mesh).
- **Positive**: Our repo becomes a curated, hash-verified DAT source — useful to the preservation community independent of mesh-arkade.
- **Neutral**: Requires standing up a GitHub repo + Action when ready. Not a code change — an infrastructure task.
- **Deferred**: Peer consensus (CORE-011). The hash verification gate is Phase 4; the URL migration can happen earlier once the repo exists.

## Implementation Note

Do not change the fetch URL until the controlled repo exists and the GitHub Action is publishing a manifest. libretro-database remains the source until then.
