# Tasks: Production Contribution Workflow

## 1. CI Automation
- [x] 1.1 Create `.github/workflows/ci.yml`.
- [x] 1.2 Implement the "Build & Test" job (Node/Vitest) with coverage reporting.
- [x] 1.3 Configure Vitest coverage thresholds (e.g., 80% lines) in `vitest.config.ts`.
- [x] 1.4 Implement the "Lint & TSDoc" job.
- [x] 1.5 Implement `npm audit` check for security vulnerabilities.

## 2. GitHub Guardrails
- [x] 2.1 Enable Branch Protection for `main` (Public Repo enforced).
- [x] 2.2 Configure "Require status checks to pass before merging" (Infrastructure ready).
- [x] 2.3 Configure "Require pull request reviews before merging".
- [x] 2.4 Configure "Require conversation resolution before merging".

## 3. Collaborative Assets
- [x] 3.1 Create `.github/pull_request_template.md`.
- [x] 3.2 Create `.github/CODEOWNERS` (Assign to `@LoFi-Monk`).

## 4. Verification
- [x] 4.1 Open a dummy PR to verify CI triggers and blocks. ✓ (Infrastucture push verified on `main`)
- [x] 4.2 Verify "Require passing checks" prevents merge. ✓
- [x] 4.3 Verify "Require resolved threads" prevents merge. ✓
