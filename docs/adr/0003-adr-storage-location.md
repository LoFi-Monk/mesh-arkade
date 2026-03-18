# ADR 0003: Canonical ADR Storage Location

**Status**: Accepted
**Date**: 2026-03-18

## Context and Problem Statement

ADRs were being duplicated — copies existed in both `docs/adr/` and `.automaker/context/adr/`. This created a maintenance burden and potential for the two copies to drift out of sync. We needed a single source of truth.

## Decision

`docs/adr/` is the canonical location for all ADRs. The `.automaker/context/adr/` directory is removed. AutoMaker agents find ADRs by following the links in `.automaker/context/context-index.md`, which maps directly to `docs/adr/`.

## Consequences

- **Positive**: Single source of truth — no duplication, no drift.
- **Positive**: ADRs are visible on GitHub in the standard location.
- **Negative**: AutoMaker agents must follow the context-index link rather than reading a local copy — acceptable given context-index is always loaded.
