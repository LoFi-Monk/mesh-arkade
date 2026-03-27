# ADR-0015 — Copyright-Safe Testing Strategy (Mock Fixtures)

**Status:** Accepted
**Date:** 2026-03-26

## Context and Problem Statement
Testing the core verification pipeline requires ROMs and DATs. However, committing actual game ROMs (like Nintendo IP) or even homebrew ROMs to a public GitHub repository poses a severe legal risk and violates preservation archival hygiene. We need a way to test the hashing and verification logic without distributing copyrighted files.

## Decision Drivers
- Committing commercial IP to a public repository is a legal risk.
- The project must remain resilient against DMCA takedowns.
- Automated tests (CI/GitHub) need reliable fixtures.
- Real ROMs are still necessary for manual, local testing.

## Decision
All automated tests (CI/GitHub) must use mock ROM buffers (e.g., generated string data) and dynamically generated DAT entries. Real ROMs can only be used locally and must be strictly `.gitignore`d.

## Consequences
- **Positive:** 100% legal safety and resilience against DMCA takedowns.
- **Positive:** Keeps the repository size small.
- **Positive:** Ensures tests run instantly without disk I/O bottlenecks.
- **Negative:** We cannot test the verification logic against actual ROM files in CI. (Mitigated by local manual testing with real ROMs).