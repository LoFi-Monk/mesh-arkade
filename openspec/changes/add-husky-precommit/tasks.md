## 1. Install Dependencies

- [x] 1.1 Install husky and nyc as devDependencies: `npm install --save-dev husky nyc`

## 2. Add npm Scripts

- [x] 2.1 Add `prepare` script to package.json: `"prepare": "husky"`
- [x] 2.2 Add `test:coverage` script: `"test:coverage": "npm run build && brittle-bare --coverage dist/test/*.test.js"`
- [x] 2.3 Add `coverage:check` script: `"coverage:check": "nyc check-coverage --statements 80 --branches 80 --functions 80 --lines 80"`
- [x] 2.4 Add `precommit` script: `"precommit": "npm run lint && npm run test:coverage && npm run coverage:check"`

## 3. Verify Coverage Output

- [x] 3.1 Run `npm run test:coverage` and confirm `./coverage/coverage-final.json` exists in Istanbul format
- [x] 3.2 Run `npm run coverage:check` and confirm nyc reads the output correctly
- [x] 3.3 If nyc fails to read Brittle output, swap nyc for c8 in `coverage:check` and update devDependency

## 4. Configure Husky

- [x] 4.1 Run `npx husky init` to scaffold `.husky/` directory
- [x] 4.2 Write `.husky/pre-commit` containing: `npm run precommit`
- [x] 4.3 Verify hook fires on `git commit` on Windows Git Bash

## 5. Update CI

- [x] 5.1 In `.github/workflows/ci.yml`, move lint step before test step
- [x] 5.2 Replace `npm test` with `npm run test:coverage`
- [x] 5.3 Add `npm run coverage:check` step after test

## 6. Verify End-to-End

- [x] 6.1 Run `npm run precommit` manually — confirm it passes
- [x] 6.2 Introduce a lint error, attempt commit — confirm hook blocks it
- [x] 6.3 Drop coverage below 80%, attempt commit — confirm hook blocks it
- [x] 6.4 Push to dev — confirm CI passes with coverage step
