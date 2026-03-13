# Tasks: Setup Husky Hooks

## 1. Automation Infrastructure

- [x] 1.1 Install `husky` and `lint-staged` as dev dependencies.
- [x] 1.2 Initialize Husky (`npx husky init`).
- [x] 1.3 Configure `.husky/pre-commit` to run `npx lint-staged`.

## 2. Lint-Staged Configuration

- [x] 2.1 Add `lint-staged` configuration to `package.json`.
- [x] 2.2 Define rules for `.ts` and `.js` files (Typecheck, Test, TSDoc).

## 3. TSDoc Validation Script

- [x] 3.1 Create `scripts/check-tsdoc.mjs`.
- [x] 3.2 Implement logic to verify Intent/Guarantees in exported members.
- [x] 3.3 Test the script against `src/core/branding.ts` (should pass) and a broken sample (should fail).

## 4. Verification

- [x] 4.1 Run a trial commit with a deliberate TSDoc failure.
- [x] 4.2 Run a trial commit with a deliberate test failure.
- [x] 4.3 Verify successful commit when all checks pass.
