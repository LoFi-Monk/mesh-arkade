# ADR 0001: Record Architecture Decisions

**Status**: Accepted
**Date**: 2026-03-14

## Context and Problem Statement
As the `mesh-arkade` project grows, we need a way to track significant architectural decisions, their rationale, and their long-term consequences. Standardizing on an Architecture Decision Record (ADR) system ensures that future contributors (humans and agents) understand why certain choices were made.

## Decision
We will use the MADR (Markdown Architecture Decision Record) format for tracking decisions. ADRs are stored in `docs/adr/` with the naming scheme: `NNNN-relevant-title.md`. A context index at `.automaker/context/context-index.md` maps all external docs for AutoMaker agents.

## Consequences
- **Positive**: Historical context is preserved; avoids re-litigating past decisions without new evidence.
- **Negative**: Adds a small amount of overhead to the planning phase.
