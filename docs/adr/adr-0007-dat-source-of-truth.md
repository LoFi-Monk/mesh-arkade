# ADR-0007 — DAT Source of Truth: Libretro Database

**Status:** Accepted
**Date:** 2026-03-23

## Context and Problem Statement

MeshARKade's trust chain starts with DAT files — they provide the SHA1 hashes that verify every ROM is museum-quality. The project needs a reliable, programmatically accessible source of DATs in CLRMamePro format. Three options exist: No-Intro/Redump directly, Libretro's GitHub mirror, or allowing users to bring their own DATs.

## Decision Drivers

- **Programmatic access** — the CLI must fetch DATs automatically, no manual downloads
- **Trust** — DATs are the root of the verification chain. A bad DAT means bad verification for every file checked against it
- **Format** — parser requires CLRMamePro format
- **Freshness** — how current the DAT data is compared to the authority (No-Intro/Redump)
- **Simplicity** — fresh start, minimize moving parts

## Considered Options

1. **No-Intro / Redump directly** — the authorities. Most current data. But distribution is manual (DAT-o-Matic, redump.org). No stable API. Scraping is fragile and potentially disrespectful to their infrastructure.
2. **Libretro Database (GitHub)** — mirrors No-Intro + Redump in CLRMamePro format. Publicly accessible via GitHub API. Stable URLs. Updated less frequently (days/weeks behind source), but reliable.
3. **Bring Your Own DAT (BYOD)** — let users import any DAT file. Maximum flexibility. But introduces a trust problem: a modified DAT with wrong hashes compromises the entire verification chain. Would need consensus mechanisms (peer attestation, DAT signing, cross-source comparison) to prevent forgery.
4. **Libretro as default + BYOD as override** — best of both, but compounds the trust problem from option 3.

## Decision

**Option 2: Libretro Database as the sole programmatic DAT source.**

- Fetch DATs from `github.com/libretro/libretro-database` via GitHub API
- CLRMamePro format natively — no conversion needed
- Cache locally with a 24-hour TTL
- No-Intro and Redump remain the upstream authorities — Libretro mirrors them
- BYOD is deferred to a future epic with its own trust/consensus design

## Consequences

- **Positive**: One source, clean trust chain, fully automatable. No scraping. Pure signal — every DAT traces back to No-Intro or Redump through a known mirror.
- **Negative**: DATs may lag behind No-Intro/Redump by days or weeks. Power users who want bleeding-edge data can't override yet.
- **Neutral**: When BYOD is eventually designed, it will need to solve the trust problem (consensus, signing, or cross-verification). That complexity is intentionally deferred — not ignored.

## Key Insight

The trust is in the hash, not the source. The parser doesn't care where a DAT came from. But the *system* cares — if a DAT is forged, every file verified against it is compromised. Restricting to a known-good mirror (Libretro) keeps the trust chain simple until we have the tooling to verify arbitrary DATs.
