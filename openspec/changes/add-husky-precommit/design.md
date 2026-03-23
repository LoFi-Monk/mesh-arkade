## Context

The project has lint (ESLint + TSDoc plugin) and tests (Brittle in Bare) but no enforcement at commit time. `package.json` scripts: `build` (tsc), `test` (build + brittle-bare), `lint` (eslint), `typecheck` (tsc --noEmit). CI runs test then lint on push/PR. Brittle has built-in coverage via `--coverage` flag, outputs Istanbul-format `coverage-final.json` and V8 raw data to `./coverage/`. `coverage/` is already in `.gitignore`.

## Goals / Non-Goals

**Goals:**
- Every commit passes lint, builds, runs tests with coverage, and meets 80% threshold
- CI mirrors pre-commit checks as a safety net
- Works on Windows 11 Git Bash
- Zero friction for `npm install` → hooks are ready

**Non-Goals:**
- Pre-push hooks (revisit when tests take >10s)
- `.nycrc.json` centralized config (evaluate later)
- Coverage reports as CI artifacts (future)

## Decisions

### Husky v9 for hook management
Plain shell scripts in `.husky/`. `prepare` script auto-initializes after `npm install`. Lightweight, no config files. Alternatives: lint-staged (overkill — we run full lint, not staged-file lint), lefthook (less ecosystem adoption), manual `.git/hooks` (not portable).

### nyc for threshold enforcement
Reads Istanbul `coverage-final.json` from Brittle output. `nyc check-coverage` enforces thresholds with a single command. Alternative: c8 (also reads Istanbul format, fallback if nyc can't read Brittle output). If `brittle-bare --coverage` only outputs V8 format without Istanbul conversion, swap nyc for c8.

### Full precommit (lint + test + coverage), not lint-only
Codebase is tiny — build + test takes <5s. Multiple agents commit, so catching everything at hook time is more valuable than speed. When tests grow slow, split into pre-commit (lint) and pre-push (test + coverage).

### Lint before test in CI
Lint is fast (~2s). Fail on cheap checks before expensive build + test. Current CI runs test first — reorder.

### 80% threshold on all four dimensions
Statements, branches, functions, lines. Industry standard. Already specified in CLAUDE.md. Easy to hit on a small codebase, sets a meaningful bar going forward.

## Risks / Trade-offs

- **[Brittle coverage format unknown]** → Verify `brittle-bare --coverage` produces `coverage-final.json` in Istanbul format. If V8-only, swap nyc for c8. Test this before wiring the hook.
- **[Pre-commit speed]** → Currently <5s. Acceptable. Monitor as codebase grows. Escape hatch: split into pre-commit (lint) + pre-push (test+coverage).
- **[Windows compatibility]** → Husky v9 uses shell scripts. Git Bash on Windows handles these. Verify hook fires correctly after setup.
- **[Agent bypass]** → Agents could use `--no-verify`. CLAUDE.md explicitly forbids this. CI is the backstop.
