---
type: note
kind: adr
lifecycle: archived
status: superseded
priority: medium
tags:
  - dat
  - storage
  - architecture
description: Explicit DAT storage in ~/mesh-arkade/DATs/ — superseded by ADR-0018 (Hyperbee-only).
parent:
project: "[[Mesh-ARKade]]"
created: 2026-03-27
modified: 2026-03-31
---

# ADR-0017 — Explicit DAT Storage: ~/mesh-arkade/DATs/

**Status:** Superseded by [[adr-0018-hyperbee-only-dat-storage]]
**Date:** 2026-03-27
**Supersedes:** [[adr-0012-dat-storage-location]]

## Context and Problem Statement

Previous decisions (ADR-0012) favored storing parsed DAT data exclusively in a hidden Hyperbee database (the "Engine Room") to prevent sync drift and keep the user's filesystem clean. However, during the design of the "A Decent Collection" onboarding flow, several critical requirements emerged that necessitate a physical, user-accessible DAT storage location.

## Decision Drivers

- **User Transparency**: Preservationists want to see, verify, and export their raw XML DAT files.
- **Offline Reliability**: The app needs a local "Receipt" folder (~/mesh-arkade/DATs/) to avoid hitting GitHub on every startup or during disconnected collection initialization.
- **Swarm Transition**: Establishing a physical location for DATs is a prerequisite for the "Oracle Pattern," where peers seed physical DAT files to the swarm for P2P updates.
- **Zero-Trust Verification**: While users can see the XML files, the engine still uses a hidden, cryptographically-signed Hyperbee b-tree as the actual source of truth for verification.

## Decision

**Explicitly store raw DAT XML files in ~/mesh-arkade/DATs/ while maintaining the Hyperbee B-tree as the engine's internal verification index.**

- The App Root (~/mesh-arkade/) is established as the explicit home for user-managed data.
- DATs are fetched on-demand (S2) and saved physically to ~/mesh-arkade/DATs/.
- The Engine Room (Hyperbee) reads from these local files to populate its O(1) hash index.
- **Verification Gate**: The engine *writes* to the XML files but *never trusts* them for verification. It only trusts the hidden, internal Hyperbee database.

## Consequences

- **Positive**: Absolute transparency for the user. Offline-first reliability. Clear path for P2P DAT distribution via the swarm.
- **Negative**: Redundant storage (XML + Hyperbee). Negligible given the small size of DAT files (~5MB each).
- **Neutral**: We must ensure the engine logic correctly handles the one-way flow (XML -> Hyperbee) without creating sync loops.
