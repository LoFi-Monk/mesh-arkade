## Context

`src/core/logger.ts` already exists with `createLogger(name)` wrapping `pino/browser`. Pino is installed. The entry point `src/index.ts` currently has no logging and no startup output. The Bare runtime requires `pino/browser` — Node.js stream-based transports are not available.

Logging strategy is documented in ADR-0009: silent by default, `DEBUG=mesh-arkade` enables debug output.

## Goals / Non-Goals

**Goals:**
- Print startup banner to terminal on boot (plain `console.log`, not logger)
- Wire `createLogger` into `index.ts` with `level: 'silent'` as default
- Enable debug output when `DEBUG=mesh-arkade` is set

**Non-Goals:**
- File-based logging (deferred — ADR-0009)
- Log formatting or pretty-printing
- Log level configurability beyond the debug flag
- Modifying `src/core/logger.ts` — it is already correct

## Decisions

**Banner via `console.log`, not logger**
The banner is intentional user-facing output, not a debug event. Routing it through the logger would suppress it under the silent default. Direct `console.log` is the right tool.

**Silent default, `DEBUG` flag for debug level**
Pino's `level` option controls minimum output. Setting `level: 'silent'` suppresses all output. When `DEBUG=mesh-arkade` is set, level is overridden to `'debug'`. This follows the Node/Bare ecosystem convention for debug flags and requires no external config system.

**Single root logger in `index.ts`**
One logger created at the entry point with name `'mesh-arkade'`. Subsystems use `logger.child({ module: 'hub' })` etc. when needed in future. No logger registry or singleton pattern needed at this stage.

## Risks / Trade-offs

- **Bare `process.env` access** → `process.env.DEBUG` should be available in Bare. If not, the fallback is hardcoding `'silent'` and revisiting when Bare env access is confirmed. Low risk.
- **`console.log` banner always visible** → This is intentional. If the banner ever needs to be suppressible, it can be moved behind a flag later.

## Open Questions

(none — ADR-0009 covers all open logging decisions)
