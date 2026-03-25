# ADR-0009 — Logging Strategy

**Status:** Accepted
**Date:** 2026-03-23

## Context and Problem Statement

The app needs logging for debugging but must not pollute the terminal for end users. As a Pear CLI tool using `pino/browser` (required for Bare runtime compatibility), options are constrained — no Node.js streams or transports available. A decision is needed on what users see, what developers see, and how log volume is managed over time.

## Decision Drivers

- Terminal output must be clean for end users — logs are a developer tool
- Debug information must be accessible without modifying source code
- `pino/browser` limits transport options (console output only, no file streams natively)
- File-based logging requires custom `getFs()` integration — meaningful complexity
- App is early stage — over-engineering logging infrastructure is premature

## Considered Options

1. **Silent by default, verbose on flag** — info level always off unless `DEBUG=mesh-arkade` is set. User sees nothing from logger. Developer gets full JSON stream on demand.
2. **Info level always on** — startup banner always prints, everything else behind a flag.
3. **File-based logging with rotation** — logs write to a file via `getFs()`, terminal stays silent. Rotate on startup (overwrite) or keep N sessions (rolling).

## Decision

**Option 1: Silent by default, verbose on debug flag.**

- Logger minimum level set to `silent` by default
- `DEBUG=mesh-arkade` environment variable enables `debug` level output
- Startup banner is printed directly to terminal (plain `console.log`) — separate from the logger, intentional user-facing output
- JSON log stream goes to console when debug is enabled

## Consequences

- **Positive**: Zero terminal noise for users. Debug output available on demand. No file I/O complexity. Simple to implement.
- **Negative**: No persistent log history — once the session ends, logs are gone. Debugging across sessions requires keeping the terminal open.
- **Neutral**: Banner is decoupled from logging entirely — it's a direct console output, not a log event.

## Revisit When

- App ships to users who can't run with a debug flag — file logging becomes necessary
- Sessions run long enough that in-memory/terminal logs are insufficient
- UI is added — logs should route to a UI panel instead of terminal

## Deferred: File-Based Logging (Option 3)

File logging was discussed but deferred. When needed, the implementation would use `getFs()` from `src/core/runtime.ts` with a custom `write` function intercepting Pino's JSON output. Log management options:

- **Overwrite on startup** — simplest, single session history only
- **Rolling logs** — keep N files (`mesh-arkade.1.log`, `.2.log`), rotate on startup
- **Size-based rotation** — rotate when file exceeds X MB
- **Max line count** — append-only, trim oldest lines when limit reached

Recommended approach when implemented: rolling logs (3 sessions), overwrite on startup as interim.
