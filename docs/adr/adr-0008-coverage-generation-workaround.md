# ADR-0008 — Coverage Generation Workaround: Split Test and Coverage Steps

**Status:** Accepted
**Date:** 2026-03-23

## Context and Problem Statement

When running `brittle-bare --coverage`, Bare throws an uncaught `ENOTSOCK` error during process shutdown. The error originates in `bare-pipe` when the coverage writer tries to close a pipe that has already been destroyed. All tests pass and `coverage-final.json` is written correctly, but the process exits with code 127. This caused the `precommit` chain to fail on every commit, even when all tests passed.

## Decision Drivers

- Pre-commit hook must give a clean pass/fail signal
- Test failures must block commits — masking all errors is not acceptable
- Coverage file must be generated for threshold enforcement
- Workaround must be narrow and clearly documented

## Considered Options

1. **`|| true` on the full `test:coverage` script** — hides both test failures and ENOTSOCK. Unacceptable — a failing test would silently pass the hook.
2. **Trap and re-check exit code** — write a shell script that runs brittle-bare, saves exit code, re-runs coverage check only if exit 127. Fragile — exit 127 could mean other things.
3. **Split test and coverage into separate steps** — run `npm test` (no coverage) for a clean pass/fail, then `generate:coverage` (with `|| true`) only after tests pass to produce the coverage file, then enforce thresholds. The `|| true` is safe here because test pass/fail is already validated.
4. **Wait for upstream fix** — monitor holepunchto/brittle and holepunchto/bare-pipe for a fix. Not viable as a blocking dependency.

## Decision

**Option 3: Separate test validation from coverage generation.**

```json
"test":              "npm run build && brittle-bare dist/test/*.test.js",
"generate:coverage": "brittle-bare --coverage dist/test/*.test.js || true",
"coverage:check":    "c8 --temp-directory ./coverage check-coverage --statements 80 --branches 80 --functions 80 --lines 80",
"precommit":         "npm run lint && npm test && npm run generate:coverage && npm run coverage:check"
```

- `npm test` runs first — clean exit code, blocks on failure
- `generate:coverage` only runs after tests pass — `|| true` is safe in this context
- `coverage:check` enforces 80% threshold against the generated file

## Consequences

- **Positive**: Clean pass/fail on the hook. Test failures block commits. Coverage threshold enforced. ENOTSOCK is contained and doesn't pollute the exit code.
- **Negative**: Tests run twice per commit (once for pass/fail, once for coverage). Acceptable while the codebase is small (<5s total). Revisit when test suite grows.
- **Neutral**: ENOTSOCK error output is still visible in the terminal during `generate:coverage`. It's noisy but harmless. If/when upstream fixes the Bare pipe issue, `generate:coverage` and `test:coverage` can be collapsed back into one step.

## Revisit When

- Upstream holepunchto/brittle or holepunchto/bare-pipe ships a fix for the ENOTSOCK shutdown error — collapse back to a single `test:coverage` step.
- Test suite grows slow (>10s) — consider moving coverage generation to `pre-push` instead.
