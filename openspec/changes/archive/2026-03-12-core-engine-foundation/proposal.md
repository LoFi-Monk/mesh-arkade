# Proposal: Core Engine Foundation (Terminal First)

## Motivation
MeshARKade is pivoting to a **Terminal First** architecture. This proposal establishes the "Hub" infrastructure: a lean, headless core that manages the P2P swarm and storage. The goal is a rock-solid, unix-style CLI tool that is fast, lightweight, and **Agent-Friendly** (easy for AI tools to parse, control, and automate).

## Project Rules & Standards
> [!IMPORTANT]
> This project follows strict architectural and coding standards. The implementation agent MUST saturate their context with the following rules:
> - **Pair Programming Rules**: [pair_programing.md](file:///c:/ag-workspace/mesh-arkade/.agent/rules/pair_programing.md)
> - **TSDoc Comment Style**: [comment-styleguide.md](file:///c:/ag-workspace/mesh-arkade/.agent/rules/comment-styleguide.md) (Note: Verify the exact path in prompt context if missing)
> - **Always On Rules**: [ALWAYS_ON_RULES.md](file:///c:/ag-workspace/mesh-arkade/.agent/ALWAYS_ON_RULES.md)

## MANDATORY CONSTRAINTS
> [!IMPORTANT]
> **Test-Driven Development (TDD) Enforcement**
> Every core module, utility, and bridge logic MUST be implemented via TDD. Tests (Vitest) must be written *before* the implementation code. No code will be merged into the core without matching test coverage.

> [!IMPORTANT]
> **Agent Optimization**
> All commands must support a `--json` flag for structured output. The splash screen MUST be skippable via a `--silent` flag or when `stdout` is not a TTY. Ensure non-interactive execution by default.

## Proposed Changes

### 1. Shared Core & Branding
- **Refactor**: Move `src/lib/branding.ts` to `src/core/branding.ts`.
- **Identity**: Ensure the branding engine (tagline generation, system strings) is pure JS/TS with no browser dependencies.

### 2. Dual-Mode Entry
- **index.js**: Refactor the main entry point to detect the environment. 
  - If `Pear.app.key === null` and no GUI is requested, boot the **Headless Hub**.
  - If a GUI is requested, boot the **Electron Bridge** as established in Phase 1.

### 3. Terminal Experience
- **Splash**: Implement a simple, lean ASCII "MeshARKade" header for the terminal.
- **Terminal UX**: Standard unix-style STDOUT/STDIN. No complex stateful UI components.

### 4. Headless Infrastructure
- **Headless Hub**: Initialize a local bridge (socket/pipe) to allow future CLI tools and the PWA to communicate with the central engine.

## Verification Plan
### Automated Tests
- `npm run test`: All core branding logic and environment detection must pass unit tests.
- `npm run test:ui`: Ensure no regressions for the existing React UI.

### Manual Verification
- `pear run --bare .`: Verify the terminal splash and status bar appear correctly in PowerShell.
- `pear run .`: Verify the Electron app still boots correctly and displays the UI.
