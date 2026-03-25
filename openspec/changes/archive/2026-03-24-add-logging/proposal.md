## Why

The app has no observable startup signal and no debug instrumentation. Operators and developers have no way to confirm the app booted correctly or trace issues during development.

## What Changes

- A plain text startup banner is printed to terminal on boot — intentional user-facing output, separate from the logger
- `createLogger` (already implemented in `src/core/logger.ts`) is wired into `index.ts`
- Logger is silent by default; `DEBUG=mesh-arkade` environment variable enables debug-level JSON output to console

## Capabilities

### New Capabilities

- `startup-output`: Plain text banner printed to terminal on boot via `console.log`. Text: `Mesh ARKade | A Decent Game Collection`
- `debug-logging`: Logger wired into entry point with silent-by-default strategy; debug output enabled via `DEBUG=mesh-arkade`

### Modified Capabilities

(none)

## Impact

- `src/index.ts` — imports `createLogger`, adds banner output and logger initialisation
- No new dependencies — `pino` and `src/core/logger.ts` already exist
- `pino/browser` used for Bare runtime compatibility (console transport only)
- Logging strategy documented in ADR-0009
