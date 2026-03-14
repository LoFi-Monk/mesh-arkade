# Devin Review Guidelines: MeshARKade

This file contains specific instructions for Devin Review to ensure pull requests align with project standards.

## 🏛️ Core Principles

- **CLI-First**: All tools must work in the terminal as standalone utilities before being wrapped in any UI.
- **Runtime Agnostic**: Logic (DAT/Hypercore/Swarm) should remain "Bare-compatible" — avoid runtime-specific APIs (like Node `fs` or browser `window`) in the core engine.
- **Pear Runtime**: Be strict about Pear-specific best practices (e.g., `Pear.teardown()`, `pear-bridge`).
- **P2P Standards**: Prioritize deterministic logic and metadata integrity for decentralized archival. 

## ✍️ Documentation & Comments

> [!IMPORTANT]
> **TSDoc shape is MANDATORY.** Every public function/module must have:
> - **Intent**: Why this exists.
> - **Guarantees**: What it promises to the caller.
> - **Constraints**: Non-obvious warnings or usage rules.

- Refer to [comment-styleguide.md](file:///c:/ag-workspace/mesh-arkade/.agent/comment-styleguide.md).
- Do not restate implementation details in comments.

## 🛠️ Code Standards

- **Types**: No `any`. Use strict typing and interfaces.
- **Naming**: `camelCase` for vars/functions, `PascalCase` for components/types.
- **Patterns**: Prefer `Result/Either` types over generic exceptions for error handling.
- **Architecture**: Follow the definitions in [AGENTS.md](file:///c:/ag-workspace/mesh-arkade/AGENTS.md).

- **Signed Commits**: (Optional for now) Require cryptographic proof of authorship for decentralized trust.

## 🔍 Review Focus

- **Deep Context**: Leverage your understanding of this codebase and other high-quality P2P/Archival repositories. Flag inconsistencies with our 'Museum-Quality' mission.
- **Architectural Integrity**: Ensure TSDoc matches the actual behavior and intent.
- **Path Handling**: Be extremely vigilant about path case-sensitivity (Avoid `toLowerCase()` on full paths).
- **Concurrency**: Look for unsafe concurrent access to shared state (e.g., `mounts.json`).
- Look for logic that can be extracted into a CLI utility if it's currently coupled to the UI.
- Check that `Husky` hooks haven't been bypassed.
- Verify that no sensitive data is logged in background processes.

## 🚫 Ignored Paths

- `.agent/*` (Antigravity's workspace)
- `.open-code/*` (Opencode's workspace)
- `docs/*`
