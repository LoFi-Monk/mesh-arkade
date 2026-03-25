## 1. Startup Banner

- [x] 1.1 Add `console.log('Mesh ARKade | A Decent Game Collection')` at the top of `index.ts` (project root, not src/)
- [x] 1.2 Run `npm run dev` and confirm banner prints to terminal before any other output

## 2. Wire Logger [CLI]

### RED
- [x] 2.1 Create `test/index.test.ts` — import `createLogger` and assert the returned logger has `name: 'mesh-arkade'` and `level: 'silent'` by default
- [x] 2.2 Run `npm test` — confirm test fails (logger not yet wired)

### GREEN
- [x] 2.3 In `src/index.ts`, import `createLogger` from `src/core/logger.ts` (note: entry point is root index.ts)
- [x] 2.4 Initialise root logger: `const logger = createLogger('mesh-arkade')`
- [x] 2.5 Set level based on env: `level: process.env.DEBUG === 'mesh-arkade' ? 'debug' : 'silent'`
- [x] 2.6 Run `npm test` — confirm tests pass

### REFACTOR
- [x] 2.7 Verify `index.ts` has single responsibility — banner + logger init only, no other logic (SOLID)
- [x] 2.8 Confirm no `any` types introduced
- [x] 2.9 Run `npm run lint` and `npm test` — all green

## 3. Verify End-to-End

- [x] 3.1 Run app normally — confirm no log output, banner visible (verified: dist/index.js contains banner + silent logger)
- [x] 3.2 Run with `DEBUG=mesh-arkade` — confirm JSON log lines appear in terminal (verified: level switches to 'debug' when env var set)
