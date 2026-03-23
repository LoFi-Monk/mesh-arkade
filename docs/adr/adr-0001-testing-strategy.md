# ADR-0001 — Testing Strategy: Brittle + TypeScript Compile Step

**Status:** Accepted
**Date:** 2026-03-23

## Context and Problem Statement

Mesh ARKade is a Pear/Bare terminal application written in TypeScript. The Bare runtime does not natively support TypeScript. We need a testing strategy that:
- Maintains TypeScript for type safety and agent guardrails
- Tests code in the actual Bare runtime (not Node.js)
- Is simple enough that agents don't introduce drift

In v1, all tests ran under Vitest in Node mode. Tests passed but the runtime was wrong — Bare-specific behaviour was never validated. This is what we are correcting.

## Decision Drivers

- Tests must run in Bare, not Node — runtime correctness is non-negotiable
- TypeScript is required — agents write worse code without it
- One test runner — two runners (Vitest + Brittle) creates a boundary agents will ignore
- Myrient shutdown 2026-03-31 — no time for complex tooling experiments

## Considered Options

1. **Vitest only** — fast, native TS, but runs in Node. Same mistake as v1.
2. **Vitest (unit) + Brittle (integration)** — architecturally sound but two runners means agents default to Vitest for everything.
3. **Brittle only + compile TS → JS** — single runner, tests in Bare, TypeScript maintained via build step.
4. **bare-typescript** — custom Bare module loader for .ts files, no build step needed. Not ready yet.

## Decision

**Option 3: Brittle only, compile TypeScript to `dist/`, run tests against compiled output.**

- `tsc` compiles `src/` and `test/` to `dist/`
- `brittle-bare dist/test/*.test.js` runs tests in the Pear/Bare runtime
- Single test runner — no ambiguity for agents
- TypeScript enforced at compile time before any test runs

## Consequences

- **Positive**: Tests run in real Bare. TypeScript guardrails intact. One runner, clear rules.
- **Negative**: Build step required before running tests. Slightly slower feedback loop than Vitest.
- **Neutral**: When bare-typescript matures, we can drop the compile step with minimal changes.
