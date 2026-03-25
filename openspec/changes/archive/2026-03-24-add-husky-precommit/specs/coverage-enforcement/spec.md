## ADDED Requirements

### Requirement: Test coverage generation
The `test:coverage` npm script SHALL build TypeScript and run Brittle tests in the Bare runtime with coverage enabled, outputting coverage data to `./coverage/`.

#### Scenario: Coverage output generated
- **WHEN** `npm run test:coverage` is executed
- **THEN** `./coverage/coverage-final.json` exists in Istanbul format and all tests pass

#### Scenario: Tests run in Bare runtime
- **WHEN** `npm run test:coverage` is executed
- **THEN** tests run via `brittle-bare` (not Node.js)

### Requirement: Coverage threshold enforcement at 80%
The `coverage:check` npm script SHALL enforce 80% minimum coverage on statements, branches, functions, and lines using nyc (or c8 as fallback).

#### Scenario: Coverage meets threshold
- **WHEN** `npm run coverage:check` is executed and all four dimensions are at or above 80%
- **THEN** the command exits with code 0

#### Scenario: Coverage below threshold
- **WHEN** `npm run coverage:check` is executed and any dimension is below 80%
- **THEN** the command exits with non-zero code and reports which dimensions failed

### Requirement: Coverage tool compatibility with Brittle output
The coverage threshold tool SHALL read the Istanbul-format `coverage-final.json` produced by `brittle-bare --coverage`. If Brittle outputs V8 format only, c8 SHALL be used instead of nyc.

#### Scenario: Istanbul format detected
- **WHEN** `brittle-bare --coverage` produces `coverage/coverage-final.json` in Istanbul format
- **THEN** `nyc check-coverage` reads it correctly

#### Scenario: V8-only format fallback
- **WHEN** `brittle-bare --coverage` does not produce Istanbul format
- **THEN** `c8 check-coverage` is used instead of `nyc check-coverage`
