# ADR-0005 — OpenSpec Over AutoMaker

**Status:** Accepted
**Date:** 2026-03-22

## Context and Problem Statement

AutoMaker provided a visual feature board and agent execution loop for managing development work. As the project matured, the tool became a liability — silent agent failures, high token overhead from XML spec generation, a black-box execution model, and a separate system to maintain alongside the actual codebase. A decision was needed on how to manage change going forward.

## Decision Drivers

- Token efficiency — AutoMaker's XML app_spec.txt was 164KB of auto-generated context loaded into every agent session
- Visibility — agent execution was opaque; failures were silent and hard to debug
- Control — no way to intervene mid-execution or shape how agents approached a task
- Proven alternative — OpenSpec was battle-tested on the Criticon project with a clear, lightweight workflow
- Multi-agent support — needed a workflow that worked across Claude Code, OpenCode (Gemini), and future agents

## Considered Options

1. **Keep AutoMaker** — continue using the visual board and agent loop as-is
2. **OpenSpec** — spec-driven change management via CLI slash commands, proposals live as markdown files
3. **No formal workflow** — ad-hoc changes, rely on git discipline alone

## Decision

Adopt OpenSpec. Drive all code changes through spec proposals (`/opsx-propose`) reviewed by a human before execution (`/opsx-apply`). Vault PM (Obsidian Bases) replaces the feature board for tracking work items. CLAUDE.md becomes the single source of truth for how work gets done.

Key workflow: brainstorm → propose → review → apply → verify → commit.

## Consequences

- **Positive**: Full visibility into what agents will do before they do it. Drastically lower token cost. Works across multiple AI agents (Claude, Gemini). Vault PM gives richer project tracking than a flat feature board.
- **Negative**: No visual board — work tracking requires Obsidian. Slightly more manual than AutoMaker's one-click execution.
- **Neutral**: AutoMaker skills and config deleted from repo. Valuable context docs (architecture, roadmap, engineering standards) preserved to vault before removal.
