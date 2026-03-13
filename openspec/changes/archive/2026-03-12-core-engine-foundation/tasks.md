# Tasks: Core Engine Foundation

## 1. Test Suite & TDD Foundation (Mandatory First Step)

- [x] 1.1 Set up Vitest configuration for `src/core`.
- [x] 1.2 Create `src/core/__tests__/branding.test.ts` with expected identity guarantees.
- [x] 1.3 Create `index.test.js` to verify environment detection logic.

## 2. Shared Core Refactor

- [x] 2.1 Refactor and move `branding.ts` to `src/core/branding.ts`.
- [x] 2.2 Implement the branding logic to pass all TDD requirements.
- [x] 2.3 Ensure TSDoc comments follow the Intent/Guarantee style for all exported functions.

## 3. Dual-Mode Entry Point

- [x] 3.1 Update `index.js` to support environment detection.
- [x] 3.2 Implement the "Bare" boot routine (Terminal initialization).

## 4. Terminal UX & Branding

- [x] 4.1 Implement the lean ASCII Header.
- [x] 4.2 Verify splash/tagline displays correctly via `pear run --bare .`.
- [x] 4.3 Implement `--json` and `--silent` support for the splash and initial status.
- [x] 4.4 Implement standard help command output.

## 5. Headless Bridge Foundation

- [x] 5.1 Initialize the local socket bridge in the Core Hub.
- [x] 5.2 Validate socket persistence relative to `Pear.app.storage`.
