## Why

Multiple agents (Claude, Devin, OpenCode) commit to this repo with no pre-commit validation. Lint errors, test failures, and low coverage can reach the branch unchecked. CI catches problems after the fact, but the damage is already in the commit history. Husky pre-commit hooks enforce quality gates at commit time — fail fast, before bad code enters the branch.

## What Changes

- Install Husky v9 for Git hook management
- Install nyc (Istanbul CLI) for coverage threshold enforcement
- Add `test:coverage` script — runs Brittle tests in Bare with `--coverage` flag
- Add `coverage:check` script — enforces 80% threshold on statements/branches/functions/lines
- Add `precommit` script — chains lint → test:coverage → coverage:check
- Add `prepare` script — initializes Husky after `npm install`
- Create `.husky/pre-commit` hook that runs the `precommit` script
- Update CI to run coverage-enabled tests and enforce thresholds (mirror pre-commit checks)
- Reorder CI steps: lint before test (fail fast on cheap checks)

## Capabilities

### New Capabilities
- `pre-commit-hooks`: Husky-managed Git pre-commit hook that runs lint, tests with coverage, and threshold enforcement before every commit
- `coverage-enforcement`: Brittle coverage output piped to nyc for 80% threshold checking on statements, branches, functions, and lines

### Modified Capabilities

## Impact

- **package.json**: New devDependencies (husky, nyc), new scripts (test:coverage, coverage:check, precommit, prepare)
- **.husky/pre-commit**: New file — shell script that runs `npm run precommit`
- **.github/workflows/ci.yml**: Replace `npm test` with `npm run test:coverage`, add `coverage:check` step, reorder lint before test
- **Developer workflow**: Every `git commit` now runs lint + build + test + coverage check. Blocked if any step fails.
