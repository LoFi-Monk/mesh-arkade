---
name: devin-review
description: Triage, delegate fixes, and resolve Devin PR review comments. Use this skill when Devin has posted a review on a PR and the comments need to be addressed. Handles the full cycle — pull, triage, delegate, verify, reply, resolve.
---

# Devin Review Skill

Devin is an automated PR reviewer that posts detailed code analysis on every commit. Reviews contain a mix of bugs, flags, and info-only observations. This skill handles the full remediation cycle.

## Key Behavior

- **Devin re-reviews on every commit.** Expect repeat findings (e.g., `any` types, architectural notes). Keep responses concise — don't re-explain on every round.
- **Never reply "Fixed" before the fix is verified.** Delegate first, verify, then reply.
- **Info-only items can be replied to immediately** since they don't require code changes.

## Workflow

### Phase 1: Pull & Triage

Fetch all unresolved review threads from the PR:

```bash
# Get all top-level review comments with context
gh api repos/{owner}/{repo}/pulls/{pr}/comments \
  --jq '.[] | select(.in_reply_to_id == null) | {id: .id, path: .path, line: .line, body: .body[0:300]}'
```

Categorize each comment into one of three buckets:

| Category | Icon | Action | Reply When |
|----------|------|--------|------------|
| **Bug** | 🔴 | Must fix — delegate to code agent | After fix is verified |
| **Flag** | 🚩 | Should fix — delegate or track | After fix is verified |
| **Info** | 📝 | Acknowledge only | Immediately |

Present the triage table to the user for approval before proceeding.

### Phase 2: Acknowledge Info Items

Reply to and resolve all Info (📝) items immediately. These don't need code changes.

Common response patterns for recurring findings:
- **`any` types (dual-runtime)**: "Pragmatic workaround for dual-runtime imports (Bare vs Node). Will tighten as Bare type ecosystem matures."
- **Unused functions**: "Reserved for milestone-XX / will be cleaned up in refactor PR."
- **Performance notes**: "Acceptable for CLI usage. Will optimize if profiling shows bottleneck."
- **Bare runtime built-ins**: "`bare-*` modules are runtime built-ins, not npm dependencies."
- **Top-level await**: "We target Bare/Node ESM, not bundlers."

### Phase 3: Delegate Fixes

Generate a detailed prompt for the code agent (Opencode or Flash) covering all Bug and Flag items. The prompt must include:

1. **Branch name** — so the agent works on the right branch
2. **For each item**: file path, line number, what's wrong, what the fix should be
3. **Verification command** — `npm test && npm run typecheck`
4. **Constraint** — all existing tests must still pass

Present the prompt to the user. User relays to the code agent.

### Phase 4: Verify Fixes

When the code agent reports back:
1. Review the diff for correctness
2. Run `npm test` and `npm run typecheck` locally
3. Check for any issues the code agent may have introduced (like the Flash `seedFlag` incident)
4. Fix any issues found

### Phase 5: Commit & Push

Commit the fixes and push. Use a descriptive commit message:
```
fix: address Devin PR #{n} review findings ({count} items)
```

### Phase 6: Reply & Resolve Actionable Items

Now that fixes are verified and pushed, reply to Bug and Flag threads:

```bash
# Reply to a review comment
gh api repos/{owner}/{repo}/pulls/{pr}/comments \
  -F in_reply_to={comment_id} \
  -f body="Fixed in {commit_sha} — {brief description of fix}."
```

Then resolve all threads:

```bash
# Get unresolved thread IDs
gh api graphql -f query='
{
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr}) {
      reviewThreads(first: 30) {
        nodes {
          id
          isResolved
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id'

# Resolve each thread
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "{id}"}) { thread { isResolved } } }'
```

### Phase 7: Wait for Re-review

Devin will post a new review on the fix commit. Repeat from Phase 1. The cycle ends when:
- All threads are resolved
- CI is green
- Only Info-only items remain (no new Bugs or Flags)

## Tracked Deferrals

When items are acknowledged as "will fix in follow-up PR", track them here so they don't get lost:

<!-- Update this list as items are deferred -->
- Hub `stop()` should close Hyperbee/Corestore (resource leak) — refactor PR
- `getSystemDefinition` loose `.includes()` matching — refactor PR
- Dead `askQuestion` function cleanup — index.js refactor PR
- `drawProgressBar` unused — wire up in milestone-05

## Tips

- **Batch replies**: Use a single bash command with multiple `gh api` calls to reply to all comments at once.
- **Devin repeats itself**: The `any` type findings came up in both review 1 and review 2. Keep a mental model of what's been addressed — responses can reference prior threads.
- **Coverage threshold**: Fixes that change code may shift branch coverage below 80%. Always check coverage after fixes.
- **Flash vs Opencode**: Use Flash for mechanical fixes (rename variable, remove debug log). Use Opencode for fixes requiring project context (architecture, Bare runtime patterns).
