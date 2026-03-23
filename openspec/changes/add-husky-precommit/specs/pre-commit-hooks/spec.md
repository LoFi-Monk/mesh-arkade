## ADDED Requirements

### Requirement: Husky initializes on npm install
The system SHALL run `husky` via the `prepare` script after `npm install`, creating the `.husky/` directory and registering Git hooks automatically.

#### Scenario: Fresh clone and install
- **WHEN** a developer runs `npm install` on a fresh clone
- **THEN** the `.husky/` directory exists and `.husky/pre-commit` is registered as a Git pre-commit hook

### Requirement: Pre-commit hook runs quality gates
The `.husky/pre-commit` hook SHALL execute the `precommit` npm script, which chains lint, test with coverage, and coverage threshold check in sequence.

#### Scenario: Clean commit passes all checks
- **WHEN** a developer runs `git commit` with code that passes lint, tests, and meets 80% coverage
- **THEN** the commit succeeds

#### Scenario: Lint failure blocks commit
- **WHEN** a developer runs `git commit` with code that has lint errors
- **THEN** the commit is blocked and lint errors are displayed

#### Scenario: Test failure blocks commit
- **WHEN** a developer runs `git commit` with code that has failing tests
- **THEN** the commit is blocked and test failures are displayed

#### Scenario: Coverage failure blocks commit
- **WHEN** a developer runs `git commit` with code that drops coverage below 80%
- **THEN** the commit is blocked and the coverage shortfall is displayed

### Requirement: Pre-commit hook execution order
The `precommit` script SHALL run checks in this order: lint first (fast fail), then test with coverage, then coverage threshold check.

#### Scenario: Lint runs before tests
- **WHEN** code has both lint errors and test failures
- **THEN** only lint errors are reported (tests are not run)

### Requirement: CI mirrors pre-commit checks
The GitHub Actions CI pipeline SHALL run the same checks as the pre-commit hook: lint, test with coverage, and coverage threshold enforcement.

#### Scenario: CI enforces coverage on push
- **WHEN** code is pushed to main or dev, or a PR is opened to main
- **THEN** CI runs lint, test:coverage, and coverage:check, failing the build if any step fails

#### Scenario: CI runs lint before test
- **WHEN** CI executes the pipeline
- **THEN** lint runs before test:coverage (fail fast on cheap checks)
