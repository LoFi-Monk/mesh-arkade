# Engineering Standards

These rules apply to every task. Non-negotiable.

## Test-Driven Development

Write tests before or alongside implementation. No production code without a corresponding test.

- Tests live in `src/**/__tests__/` alongside the module they test
- Use Vitest (`import { describe, it, expect, vi } from 'vitest'`)
- Test file naming: `{module-name}.test.ts`
- All tests must pass before committing: `npm test`
- Coverage threshold is 80% — check after adding new code: `npm run coverage`

## TypeScript

- No `any` — use proper types or generics. If a dual-runtime workaround genuinely requires it, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why
- No type assertions (`as Foo`) unless unavoidable — prefer type guards
- Run `npm run typecheck` before committing — zero errors required

## TSDoc Comments

Every exported function, type, and class needs a TSDoc comment. Required shape:

```ts
/**
 * @intent What this does and why it exists.
 * @guarantee What the caller can rely on (invariants, return shape).
 * @constraint Anything the caller must know (error cases, side effects, limitations).
 */
```

Vague or implementation-restating comments are forbidden. Explain intent and guarantees, not mechanics.

## SOLID + DRY

- **Single responsibility**: one function/module does one thing
- **No duplicated logic**: extract shared behaviour before implementing
- **Open/closed**: extend via composition, not modification
- **Dependency inversion**: depend on abstractions, not concretions

## Bare Runtime Compatibility

All core logic must run in the Pear `Bare` runtime — no Node.js or DOM assumptions.

- No `require('fs')` directly — use `getFs()` from `src/core/runtime.ts`
- No `require('crypto')` directly — use `getCrypto()` from `src/core/runtime.ts`
- No `fetch` directly — use `getFetch()` from `src/core/runtime.ts`
- No `localStorage`, `window`, `document`, or browser globals
- No HTTP servers — this is a P2P-first app (Hyperswarm, not HTTP)

## Git Discipline

- Never use `git add .` — stage files explicitly by name
- Never force push
- Every feature gets its own branch and PR
- Commit message format: `type: short description` (e.g. `feat:`, `fix:`, `chore:`, `test:`)
- Draft PR first — only mark ready after CI passes

## Linting

Run before committing: `npm run lint`

All lint errors must be resolved — do not disable rules unless there is a documented reason.

## Pre-commit Hooks

Husky runs automatically on commit. If it fails:
1. Read the error — do not use `--no-verify` to skip
2. Fix the underlying issue
3. Re-stage and commit again
