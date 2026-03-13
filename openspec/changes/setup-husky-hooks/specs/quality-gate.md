# Spec: Pre-commit Quality Gate

## Objective
Establish mandatory checks that prevent the commitment of code that violates project quality standards.

## Requirements

### 1. Test Integrity
- **WHEN** a `.ts` or `.js` file is staged
- **THEN** Vitest must run tests related to the changed files
- **THEN** The commit must fail if any test fails

### 2. Type Safety
- **WHEN** a `.ts` file is staged
- **THEN** `tsc --noEmit` must be executed
- **THEN** The commit must fail if there are any type errors

### 3. Documentation (TSDoc)
- **WHEN** a file in `src/` is staged
- **THEN** The `check-tsdoc.mjs` script must scan for exported members
- **THEN** Every exported member MUST have a TSDoc block starting with `/**`
- **THEN** The TSDoc block MUST contain the following sections:
    - `Intent` (explaining why the code exists)
    - `Guarantees` or `Contracts` (explaining what it provides)
- **THEN** The commit must fail if these requirements are not met

## Implementation Constraints
- Hooks must be fast (under 10 seconds for typical small commits).
- Must work on both Windows (PowerShell) and Unix-like environments.
- Must support bypassing via `--no-verify` for exceptional cases.
