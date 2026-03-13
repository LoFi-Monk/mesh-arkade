---
description: How to safely wrap up a session and preserve context
---

# Session End Workflow

This workflow ensures that all progress, decisions, and technical knowledge are preserved for the next session.

1. **Update Agent Notes**
   - Proactively update `.agent/agents-notes/ag-note.md` with:
     - Completed tasks from the current session.
     - New technical decisions or "Aha!" moments.
     - What the next session should focus on immediately.

2. **Roadmap & OpenSpec Maintenance**
   - Update `.agent/roadmap.md` status for the active milestone.
   - If work was completed, use `/opsx-archive` to move the change to the archives.
   - Ensure the `task.md` artifact reflects the final state of work.

3. **Artifact Generation**
   - Create or update the `walkthrough.md` artifact to document changes and proof of work.
   - Include any relevant terminal outputs or visual confirmations.

4. **Sanitize Environment**
   - Clean up `.agent/temp/` for files that are no longer needed.
   - Commit changes with a descriptive message if appropriate.

5. **Final Notify**
   - Use `notify_user` to provide a concise summary of accomplishments and the exact state of the project for the next handoff.
