---
description: Update the handoff note with everything that happened this session.
---

# /end-session

Review the conversation and update `.claude/notes/claude-note.md` with a clean handoff for the next session.

The note should always contain these sections (rewrite, don't append):

## Status
One line: what milestone we're on, what just happened.

## Current Branch
The active branch, or `main` if clean.

## In Progress
Anything started but not finished this session. Be specific — file, function, what's left to do.

## Deferred Items
Running list of known issues punted to future PRs. Keep entries from the previous note unless they were resolved this session.

## Tooling
Any scripts, env requirements, or gotchas the next session needs to know. Keep this current — remove stale entries.

## Architecture Notes
Stable pointers (ADR locations, OpenSpec locations, key decisions). Only update if something changed.
- ADRs: `.agent/adr/`
- OpenSpecs: `openspec/specs/`

## Observations
Things noticed that aren't bugs or tasks yet — patterns, oddities, future cleanup candidates.

---

After writing the file, confirm to Lofi: "Handoff note updated. See you next session."
