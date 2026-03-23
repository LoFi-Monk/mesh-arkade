# ADR-0006 — ADR Dual Location: Vault and Repo

**Status:** Accepted
**Date:** 2026-03-22
**Supersedes:** ADR-0003 (Canonical ADR Storage Location)

## Context and Problem Statement

ADR-0003 established `docs/adr/` as the single source of truth, with AutoMaker agents finding ADRs via `context-index.md`. AutoMaker has since been removed. The project now uses a vault-based PM system (Obsidian Bases) alongside the codebase. ADRs written in the vault were not making it into `docs/adr/`, meaning agents working in the codebase couldn't find them.

## Decision Drivers

- Agents (Claude, OpenCode, Gemini) orient from the codebase — they need ADRs in `docs/adr/` to find them
- Lofi navigates project context from the vault — ADRs need to live in the vault to link to epics and architecture notes
- A single location forces a choice between agent access and human navigation — both matter

## Considered Options

1. **Vault only** — ADRs live in the vault, agents don't find them
2. **Repo only** — ADRs live in `docs/adr/`, vault PM loses the links
3. **Dual location** — vault is the authoring location, `docs/adr/` receives a copy when the ADR is accepted

## Decision

Dual location. **Vault is where ADRs are authored** (full template, PM frontmatter, links to epics and architecture notes). **`docs/adr/` receives a copy** in the simpler repo format when the ADR reaches `accepted` status. The vault copy is the rich version; the repo copy is agent-readable.

## Consequences

- **Positive**: Agents can find ADRs in the codebase. Lofi can navigate them from the vault with full PM context.
- **Negative**: Two copies to keep in sync. Mitigation: treat vault as source of truth — only copy to repo when accepted, don't edit the repo copy directly.
- **Neutral**: ADR-0003 is superseded but preserved — its reasoning (avoid drift between copies) still applies and informs the mitigation above.
