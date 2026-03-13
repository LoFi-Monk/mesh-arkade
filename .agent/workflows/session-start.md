---
description: How to initialize a new session and regain project context
---

// turbo-all
# Session Start Workflow

This workflow ensures the agent has full context and the environment is ready for development.

1. **Knowledge Discovery**
   - Review KI summaries provided at conversation start.
   - Read relevant KI artifacts from the summaries.

2. **Agent Context Retrieval**
   - Read `.agent/agents-notes/ag-note.md` to identify the current focus and project goals.
   - View `.agent/roadmap.md` to see the current milestone status.
   - Read `.agent/agents-notes/preservation-standards.md` if the task involves P2P or ROM management.

3. **Current Task Assessment**
   - Locate the most recent `tasks.md` in `openspec/changes/` for the active milestone.
   - Check the `GEMINI.md` notes for any specific updates from the user.

4. **Environment Verification**
   - Run `npm run typecheck` to ensure there are no existing regressions.
   - Verify if any development servers (`npm run dev`) or agents (`opencode`) are already running.

5. **Acknowledge Readiness**
   - Briefly summarize the current state and proposed next steps to the user.
