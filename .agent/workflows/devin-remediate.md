---
description: A standardized workflow for remediating Devin PR reviews via Opencode delegation.
---

# /devin-remediate

Use this workflow to efficiently address bugs, warnings, and flags identified by Devin's PR checks.

## Steps

### 1. Analysis & Triaging
- **Researcher**: Navigator (Antigravity)
- **Action**: Use `browser_subagent` to read the latest Devin analysis (Bugs, Warnings, Flags).
- **Goal**: Group items by component and severity. Identify which items were "fixed" but still flagged (e.g., due to edge cases).

### 2. Implementation Proposal
- **Researcher**: Navigator (Antigravity)
- **Action**: Create/Update a `Phase` in `task.md` and `implementation_plan.md`.
- **Goal**: Translate Devin's high-level flags into specific, actionable implementation notes for Opencode.

### 3. Delegation (Opencode)
- **Researcher**: Executor (Opencode)
- **Action**: navigator prompts Opencode with a detailed list of tasks.
- **Goal**: Implement the technical changes and run local regression tests (`npm test`, `npm run typecheck`).

### 4. Verification & Scan
- **Researcher**: Navigator (Antigravity)
- **Action**:
    - Verify Opencode's fixes locally.
    - Push to the feature branch.
    - Wait for Devin to re-scan.
- **Goal**: Reach "Info-only" status (Green check + Info flags).

### 5. Finalize
- **Researcher**: Navigator (Antigravity)
- **Action**:
    - Resolve GitHub conversation threads.
    - Clean up commit history (Squash).
    - Request final merge.

// turbo-all
## Commands
- `npm test`
- `npm run typecheck`
- `git status`
- `git add . && git commit -m "fix: logic remediation"`
- `git push origin [branch]`
