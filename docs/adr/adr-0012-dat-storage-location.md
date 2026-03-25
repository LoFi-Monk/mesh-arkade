# ADR-0012 — DAT Storage Location: In-App Hyperbee as Source of Truth

**Status:** Accepted
**Date:** 2026-03-25

## Context and Problem Statement

DAT files fetched from the Libretro Database need a permanent home. The app uses them to verify ROMs — they are the authoritative reference for what constitutes a valid dump. A decision is needed on where parsed DAT data lives, how it stays current, and what access users have to it.

## Decision Drivers

- DAT data is the verification source of truth — it must be authoritative, consistent, and in one place
- Multiple features (S3 data layer, ROM verification, CLI tooling) all depend on this decision
- Users may want to inspect or use DAT data outside the app
- Keeping multiple copies in sync introduces drift risk

## Considered Options

1. **In-app Hyperbee, single store** — parsed DAT data lives in Hyperbee. One place to update. CLI exposes list and export commands so users can extract DATs to a directory of their choosing.
2. **File-based cache alongside Hyperbee** — raw DAT files cached on disk, parsed data duplicated into Hyperbee. Two stores to keep in sync.
3. **File-based only** — raw DAT files stored in a user-accessible directory. No Hyperbee. Simpler but not queryable.

## Decision

**Option 1: In-app Hyperbee as the single source of truth.**

- Parsed DAT data is written to Hyperbee during the fetch step (S3)
- No separate file cache — Hyperbee is the only store
- The CLI will expose two commands as a consequence of this decision:
  - `list` — show which DATs are currently stored in-app
  - `export <system> <path>` — write a DAT to a user-chosen directory
- Export is the escape hatch: users can pull DATs out if they need them for external tools

## Consequences

- **Positive**: Single source of truth — no sync drift. Hyperbee is queryable and Bare-compatible. Export gives users access without compromising the canonical store.
- **Negative**: DAT data is not human-readable by default — users must export to inspect. Acceptable given the CLI escape hatch.
- **Neutral**: BYOD DAT import remains deferred (ADR-0007). Users cannot substitute their own DAT files — the app fetches and owns the canonical copy.

## Revisit When

- A user scenario emerges where Hyperbee as the sole store creates a meaningful constraint (e.g., offline-first seeding, multi-device sync)
- BYOD DAT support is reconsidered (ADR-0007)
