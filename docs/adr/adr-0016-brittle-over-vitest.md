---
type: note
kind: adr
lifecycle: active
status: accepted
priority: high
tags:
  - testing
  - brittle
  - bare
  - architecture
description: Replace Vitest with Brittle as the test runner — Bare runtime correctness over Node-mode convenience.
parent:
project: "[[Mesh-ARKade]]"
created: 2026-03-21
modified: 2026-03-31
---

# ADR-0016 — Brittle over Vitest

**Decided:** 2026-03-21

## Decision

Replace Vitest with Brittle as the test runner for MeshARKade.

## Why

Vitest has no Bare launcher — tests run in Node mode, not against the actual runtime the app ships on. Any Node API that silently slips into the codebase won't be caught. For a Bare-first project this is a correctness gap that compounds over time.

Brittle () runs tests directly inside Bare. Coverage is solved via , already a Brittle dependency. Output is Istanbul-format — 80% thresholds carry over.

## What We Ruled Out

- **Keep Vitest**: Only advantage is watch mode and Jest-like globals — neither matters for this stack or for agent-run tests.
- **Run both in parallel**: No reason to maintain two test runners.

## Related

- [[brittle]] — tool reference
- [[CORE-008-profile-service]]
