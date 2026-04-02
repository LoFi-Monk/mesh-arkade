# ADR-0020: Deprecate IPFS and BitTorrent in Favor of Pure Pear Networking

**Date:** 2026-04-01  
**Status:** Accepted  

## Context
Initial architectural discussions and early drafts for Phase 5 (CORE-012) assumed we would use IPFS (via Trustless Gateways) and traditional BitTorrent swarms as fallback data sources for ROM seeding. We explored mapping MiNERVA's torrent `.info_hash` data directly into our catalog to bridge the traditional ROM scene into our ecosystem.

However, several architectural and technical constraints have come to light:
1. **Pear Ecosystem Compatibility**: The Holepunch (Pear) core team recommends against mixing IPFS/BitTorrent networking stacks with the Pear runtime (`Bare`). Integrating these secondary protocols introduces massive complexity, bloat, and dual-networking paradigms that fight against Pear's native strengths.
2. **Format Suitability**: IPFS is content-addressed and immutable by design. While excellent for static web assets, it is a poor format for managing a dynamic, evolving database of ROM collections where metadata (DATs) and files change frequently.
3. **Strategic Value**: Our ultimate value proposition is not just moving existing torrent files around; it is providing a superior, distributed metadata engine (clearnet hub) combined with a seamless, zero-copy P2P application (Hyperdrive).

## Decision
We will strictly enforce a **Pear-Native (Hyperdrive) networking model**.
- We are forgoing IPFS and BitTorrent implementations entirely.
- We will not attempt to bridge traditional BitTorrent swarms into our app.
- The `CORE-012 IPFS Fallback` Epic is officially deprecated and cancelled.

Instead of relying on legacy P2P networks for data, we will:
1. **Genesis Seeding**: Bootstrap the network natively by having early adopters (starting with LoFi) seed curated local collections directly into Hyperdrive via the Virtual Mirror (CORE-009).
2. **Clearnet Metadata**: Build a public GitHub Action pipeline to ingest, prep, and host all necessary DATs in one centralized, public repository. This serves as the single source of truth for ROM verification.
3. **Gamification**: Introduce bounties and XP systems for unseeded/stale ROMs to incentivize the community to keep the Hyperdrive swarm healthy natively.

## Consequences
- **Positive**: Massively simplified networking layer. The app remains lightweight, focusing purely on Hypercore/Hyperdrive protocols.
- **Positive**: Complete alignment with the Pear `Bare` runtime architecture.
- **Negative**: We cannot automatically inherit the existing seeder base of the MiNERVA tracker or other public torrent trackers. We have to build our swarm from scratch (the "Cold Start" problem). We mitigate this through the Genesis Seed strategy and social curation features ("Shelves").