# Design: Husky Pre-commit Hooks

This design outlines the integration of Husky and lint-staged to automate quality checks during the Git commit process.

## Architecture

### 1. Git Hook Management (Husky)
Husky will be used to manage Git hooks within the project. It ensures that hooks are consistently applied across all developer environments.

### 2. Selective Execution (lint-staged)
To maintain high performance, `lint-staged` will filter files changed in the current commit and run validation tools only on those files.

### 3. Validation Pipeline
For any staged `.ts` or `.js` files:
- **Type Checking**: Run `tsc --noEmit` to ensure type safety.
- **Unit Testing**: Run `vitest related --run` to verify that changes don't break existing logic.
- **Comment Validation**: Run a custom script (`scripts/check-tsdoc.mjs`) to enforce TSDoc standards.

## Technical Details

### Hook Configuration
- `.husky/pre-commit`:
  ```bash
  npx lint-staged
  ```

### Lint-Staged Configuration
In `package.json`:
```json
"lint-staged": {
  "src/**/*.{js,ts}": [
    "vitest related --run",
    "node scripts/check-tsdoc.mjs"
  ],
  "src/**/*.ts": [
    "tsc --noEmit"
  ]
}
```

### TSDoc Validator Script
A lightweight Node.js script that:
1.  Identifies exported functions, classes, and interfaces.
2.  Verifies the presence of a TSDoc block.
3.  Checks for required sections: `Intent` and `Guarantees/Contracts`.

## Risks / Trade-offs
- **Performance**: Pre-commit hooks add overhead to the commit process. We mitigate this using `lint-staged`.
- **Friction**: Strict validation can be frustrating if the rules are too aggressive. The TSDoc check should initially be a warning or scoped to `src/core` to ease adoption.
