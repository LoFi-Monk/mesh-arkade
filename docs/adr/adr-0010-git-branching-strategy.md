# ADR-0010 — Git Branching Strategy: Feature → Dev → Main

**Status:** Accepted
**Date:** 2026-03-24

## Context and Problem Statement

PRs #1–#3 merged feature branches directly to `main`. There was no documented branching strategy. This meant `main` received partially-integrated work with no staging step. For a project with agent-driven development (OpenSpec apply, Devin reviews), we need a clear flow that prevents unreviewed or unstable code from reaching the production branch.

## Decision Drivers

- Agents (Claude, OpenCode, Devin) need unambiguous rules about where to target PRs
- `main` should always be shippable — a clean snapshot of completed milestones
- Day-to-day iteration needs a branch that tolerates in-progress work
- Keep it simple — we're a small team, not running GitFlow

## Considered Options

### Option 1: Feature → Main (status quo)
Every feature branch PRs directly to `main`. Simple but no staging step. `main` accumulates partial work.

### Option 2: Feature → Dev → Main (chosen)
Feature branches PR to `dev`. `dev` is the integration branch. Promote `dev` → `main` at milestone boundaries.

### Option 3: GitFlow (develop, release, hotfix branches)
Full branching model with release branches and hotfix branches. Overkill for current team size.

## Decision

**Option 2: Feature → Dev → Main.**

```
feat/*  →  PR to dev  →  merge
                           ↓
              dev  →  PR to main  (milestone ready)
```

### Rules

1. Feature branches always target `dev`
2. `main` only receives merges from `dev`
3. Feature branches auto-delete after merge
4. CI runs on PRs to both `dev` and `main`
5. No direct pushes to `main` or `dev`

### When to promote dev → main

- Epic or milestone is complete
- CI is green on `dev`
- Lofi reviews and approves the promotion PR

## Consequences

**Good:**
- `main` stays clean and shippable
- Agents have a clear rule: always `--base dev`
- Integration issues surface on `dev` before reaching `main`
- Milestone promotion is an explicit decision, not accidental

**Bad:**
- Extra step to promote `dev` → `main`
- `dev` can drift from `main` if promotions are infrequent (mitigate by promoting at each milestone)

**Neutral:**
- Need to update CI workflow to run on `dev` PRs
- Need to update auto-merge workflow target
- Existing work on `main` stays as-is (not worth rebasing history)
