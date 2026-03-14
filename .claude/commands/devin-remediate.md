---
description: Triage and resolve Devin PR review comments. Pulls comments, categorizes by severity, delegates fixes, then replies and resolves threads.
---

# /devin-remediate

Load and follow the skill at `.claude/skills/devin-review/SKILL.md`.

Execute the workflow against the current branch's open PR. If no PR number is provided, detect it automatically:

```bash
gh pr view --json number --jq '.number'
```

Start at **Phase 1: Pull & Triage**.
