# Claude Notes (MeshARKade)

## Status: Onboarding Complete, Picking Up Milestone 04

### Current Branch: `feature/milestone-04-hyperbee-crawl`

### Context
- Taking over from Antigravity (Gemini) which hit API limit mid-PR.
- All 17 OpenSpec tasks for this milestone are checked off.
- Tests pass (76/76). TypeScript compiles clean.
- CLI commands verified working: `systems`, `init --seed`, `search`.

### In Progress
- Two bugs found and fixed by Opencode (askQuestion scope, CLI arg stripping).
- Two issues delegated to Opencode (DAT parser not extracting hashes, debug logging in search).
- PR not yet committed/pushed.

### Pending Before PR
- [ ] Confirm hash extraction fix from Opencode
- [ ] Confirm debug logging cleanup from Opencode
- [ ] Commit and push to feature branch
- [ ] PR review by Devin

### Architecture Notes
- ADRs live at `.agent/adr/` — single source of truth, do not duplicate.
- ADR-0002: Hyperbee chosen over SQLite for metadata storage (Bare-friendly, P2P portable).
- Roadmap lives at `.agent/roadmap.md`.

### Observations
- Systems list includes some oddities (Sony - PlayStation 3 shows as `- playstation 3` with leading dash). ID generation may need cleanup in a future pass.
- Region detection returns "Unknown" for many entries — parser could be smarter about extracting region from title parentheticals.
