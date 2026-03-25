# ADR-0013 — Library Terminology: ARKive and Collections

**Status:** Accepted
**Date:** 2026-03-25

## Context and Problem Statement

The app has two distinct concepts that need clear, consistent names: the curated library of verified ROMs that Mesh Arkade maintains and distributes, and the user's personal set of game files. Without locked terminology, UI copy, CLI output, and code diverge over time.

## Decision Drivers

- Scene-accurate terminology matters — the preservation community has established conventions
- Names must be distinct enough that users never confuse the two concepts
- Copy must feel intentional, not generic ("library", "database", "files")

## Considered Options

1. **ARKive / Collections** — ARKive is Mesh Arkade's curated, distributed archive. Collections is the user's personal game library.
2. **Library / Collection** — generic, low signal, easily confused with each other.
3. **Archive / Library** — Archive is accurate but loses the wordplay on "ARK" and "Arcade".

## Decision

**Option 1: ARKive and Collections.**

- **ARKive** — Mesh Arkade's curated library of verified, preservation-quality ROMs. The shared, distributed archive the app provides access to. Always capitalized as "ARKive".
- **Collections** — the user's personal game files. What they own, have validated, or are managing through the app.

These names apply consistently across:
- UI copy and empty states
- CLI output and command naming
- Code (variable names, type names, module names)
- Documentation

## Consequences

- **Positive**: Clear distinction between the app's domain and the user's domain. "ARKive" carries the Mesh Arkade brand and the preservation mission. "Collections" is intuitive for users.
- **Neutral**: "ARKive" is a coined term — requires consistent enforcement to avoid drift back to generic synonyms.

## Revisit When

- User research surfaces confusion between the two terms
- A third major concept emerges that sits between ARKive and Collections
