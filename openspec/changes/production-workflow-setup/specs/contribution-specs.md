# Spec: Contribution Quality Gates

## Objective
Define the mandatory conditions that must be met for any code to reach the `main` branch.

## Requirements

### 1. Mandatory Pull Requests (PRs)
- **WHEN** a change is proposed
- **THEN** it MUST be submitted via a Pull Request from a feature branch.
- **THEN** direct pushes to `main` MUST be rejected by the server.

### 2. Status Check: Test Coverage
- **WHEN** a PR is opened or updated
- **THEN** The GitHub CI must execute `npm test` with coverage reporting.
- **THEN** All tests MUST pass.
- **THEN** Overall code coverage MUST meet a minimum threshold (e.g., 80% lines).

### 3. Status Check: Documentation (TSDoc)
- **WHEN** code is submitted
- **THEN** The CI must run the TSDoc validator.
- **THEN** 100% of exported members MUST have a TSDoc block following the "Intent/Guarantee" pattern.
- **THEN** Failure to follow the pattern or missing comments MUST block the merge.

### 4. Human/Agent Review & Resolution
- **WHEN** a PR is reviewed
- **THEN** all conversation threads MUST be marked as `Resolved`.
- **THEN** The "Merge" button must remain disabled until resolution.

### 5. Automated Dependency Audit (The "Security Gap")
- **WHEN** dependencies are changed
- **THEN** The CI must run `npm audit`.
- **THEN** High/Critical vulnerabilities MUST block the merge.
