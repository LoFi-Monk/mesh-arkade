# Specification: Fix bare-type native addon test failure

## Problem Statement

The test suite `runtime-hashstreaming.test.ts` fails with `TypeError: require.addon is not a function` because the jsdom environment conflicts with Bare runtime native addons that use `require.addon`.

## Root Cause

The jsdom test environment doesn't provide the `require.addon` function that `bare-type` (a dependency of `bare-crypto`) requires. Switching to Node environment resolves this.

## Verification: No jsdom Dependencies

Ran grep for `window`, `document`, `localStorage` in test files:

- No tests reference these jsdom globals
- `branding.test.ts` explicitly tests that modules don't reference window/document
- Safe to switch to Node environment

## Technical Context

| Aspect     | Value                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| Root Cause | jsdom environment lacks `require.addon` API needed by bare-type native addon |
| Fix        | Change vitest.config.ts environment from "jsdom" to "node"                   |
| Risk       | Verified: no test files depend on jsdom-specific APIs                        |

## Non-Goals

- Not mocking bare-crypto globally - that would mask real failures in other tests
- Not modifying production code in runtime.ts

## Implementation Tasks

```tasks
## Phase 1: Verify no jsdom dependencies
- [ ] T001: Grep test files for window, document, localStorage references - none found, safe to proceed | File: (grep verification)

## Phase 2: Fix environment
- [ ] T002: Change vitest.config.ts environment from "jsdom" to "node" | File: vitest.config.ts

## Phase 3: Verify
- [ ] T003: Run runtime-hashstreaming test suite to confirm tests pass | File: (test execution)
- [ ] T004: Run full test suite to verify no regressions (339 tests should pass) | File: (test execution)
```
