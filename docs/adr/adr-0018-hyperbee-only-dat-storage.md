---
type: note
kind: adr
lifecycle: active
status: accepted
priority: high
tags:
  - dat
  - storage
  - hyperbee
  - architecture
description: Hyperbee is the sole DAT store — no raw XML cache on disk. Two export paths: source DAT reconstructed from ingest data, and ARKive DAT generated from enriched Hyperbee entries. Supersedes ADR-0017.
parent:
project: "[[Mesh-ARKade]]"
created: 2026-03-31
modified: 2026-03-31
---

# ADR-0018 — Hyperbee-Only DAT Storage with Dual Export

**Status:** Accepted
**Date:** 2026-03-31
**Supersedes:** [[adr-0017-explicit-dat-storage]]

## Context and Problem Statement

ADR-0017 added a physical `~/mesh-arkade/DATs/` directory to cache raw XML DAT files alongside the Hyperbee index. The stated reasons were user transparency, offline reliability, and a future Oracle Pattern seeding path. On review, none of these hold:

- **User transparency**: DAT XML files are not human-readable in practice. A settings screen listing source DATs with an export button serves this need better.
- **Offline reliability**: The Hyperbee index already is the offline store. Once `refresh` runs, the data is local permanently.
- **Oracle Pattern seeding**: When P2P DAT distribution lands (CORE-011), we replicate the Hyperbee Hypercore — not XML files.

Storing DATs twice (XML + Hyperbee) adds ~5MB per system to disk with no benefit. For 20+ systems that becomes 100MB+ of redundant data.

## Decision

**Hyperbee is the only DAT store. No XML cache on disk.**

- `saveDatCache()` is removed from `app-root.ts`
- The `DATs/` directory is not created
- `~/mesh-arkade/` retains only `config.json` (global settings)
- The Hyperbee index in `Pear.config.storage` is the single source of truth

## Export Capabilities

Two export paths are exposed via the settings UI and CLI:

### 1. Source DAT Export
Reconstructs a standard No-Intro/Libretro-compatible XML DAT from the raw source data stored in Hyperbee at ingest time. This is the DAT as we received it — useful for interoperability with tools like CLRMamePro and RomVault.

### 2. ARKive DAT Export
Generates a DAT from the ARKive's enriched Hyperbee entries for any system. This DAT includes:
- All fields from the source DAT (name, CRC, MD5, SHA1, SHA256)
- Enrichment data from supplementary DATs (developer, genre, year, publisher, region)
- Swarm verification status (verified, unverified, disputed) — when available

The ARKive DAT is a superset of any source DAT. As the swarm grows and verification history accumulates, it will be more complete and more trustworthy than any single upstream source.

## Consequences

- **Positive**: Single source of truth. No sync drift. No redundant disk usage. Clean App Root.
- **Positive**: ARKive DAT export positions mesh-arkade as a DAT producer, not just a consumer — a long-term preservation goal.
- **Negative**: `saveDatCache()` and related `app-root.ts` code added in CORE-007 must be removed. Small cleanup, tracked as part of the next PR.
- **Neutral**: `~/mesh-arkade/` still exists for `config.json`. The `DATs/` subdirectory is simply not created.
