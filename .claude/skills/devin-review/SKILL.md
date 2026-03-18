---
name: devin-review
description: Triage, delegate fixes, and resolve Devin PR review comments. Use this skill when Devin has posted a review on a PR and the comments need to be addressed. Handles the full cycle — pull, triage, delegate, verify, reply, resolve.
---

# Devin Review Skill

Devin is an automated PR reviewer that posts detailed code analysis on every commit. Reviews contain a mix of bugs, flags, and info-only observations. This skill handles the full remediation cycle.

## Key Behavior

- **Devin re-reviews on every commit.** Expect repeat findings. Keep responses concise — don't re-explain on every round.
- **Never reply "Fixed" before the fix is verified.** Delegate first, verify, then reply.
- **Info-only items can be replied to immediately** since they don't require code changes.
- **Intentional design decisions** get a reply explaining the reasoning (see AGENTS.md) then resolve — do not change them.

## Tools

All thread operations use the `gh pr-review` extension:

```bash
gh pr-review threads list --pr <N> -R LoFi-Monk/mesh-arkade
gh pr-review comments reply -R LoFi-Monk/mesh-arkade --pr <N> --thread-id <ID> --body "..."
gh pr-review threads resolve -R LoFi-Monk/mesh-arkade --pr <N> --thread-id <ID>
```

---

## Workflow

### Phase 1: Pull & Triage

Fetch all threads and filter to unresolved:

```bash
gh pr-review threads list --pr <N> -R LoFi-Monk/mesh-arkade
```

Parse the JSON. Focus on `isResolved: false` threads. Cross-reference thread IDs with PR review comment bodies via:

```bash
gh api repos/LoFi-Monk/mesh-arkade/pulls/<N>/comments --paginate
```

Categorize each unresolved thread:

| Category | Icon | Action | Reply When |
|----------|------|--------|------------|
| **Bug** | 🔴 | Must fix — delegate to Gemini | After fix is verified |
| **Flag** | 🚩 | Should fix — delegate or track | After fix is verified |
| **Info** | 📝 | Acknowledge only | Immediately |
| **Intentional** | ✅ | Reply with documented reasoning | Immediately |

Present the triage table to the user for approval before proceeding.

### Phase 2: Acknowledge Info & Intentional Items

Reply to and resolve all Info (📝) and Intentional (✅) items immediately.

Common response patterns for recurring findings:
- **SHA1-as-info_hash**: "Intentional — documented in AGENTS.md. We use file SHA1 as DHT info_hash for our custom P2P mesh. Interoperability with public BT swarms is out of scope."
- **bdecode Uint8Array**: "Intentional — TextDecoder('latin1') corrupts bytes 0x80–0x9F. Raw byte arithmetic is required. Documented in AGENTS.md."
- **Dual timer in fetchFromPeer**: "Intentional — deadlineTimer prevents adversarial peers from holding connections open. Documented in AGENTS.md."
- **`any` types (dual-runtime)**: "Pragmatic workaround for dual-runtime imports (Bare vs Node). Will tighten as Bare type ecosystem matures."
- **Bare runtime built-ins**: "`bare-*` modules are runtime built-ins, not npm dependencies."

### Phase 3: Delegate Fixes

Generate a Gemini prompt covering all Bug and Flag items. The prompt must include:

1. **Worktree path** — so Gemini works in the right place
2. **For each item**: file path, line number, what's wrong, what the fix should be
3. **Verification command** — `npm test -- --coverage` (not `npm test`)
4. **Constraint** — all 369+ tests must pass, coverage must stay above 80% all thresholds
5. **Do not commit** — human commits after review

Present the prompt to the user. User pastes it into Gemini CLI.

### Phase 4: Verify Fixes

When Gemini reports back:
1. Check `git diff --stat` — only expected files changed
2. Run `npm test -- --coverage` locally to confirm
3. Run `npm run typecheck`

### Phase 5: Commit & Push

```
fix: address Devin PR #<N> review findings (<count> items)
```

### Phase 6: Reply & Resolve Actionable Items

After fixes are verified and pushed, reply to Bug and Flag threads:

```bash
gh pr-review comments reply -R LoFi-Monk/mesh-arkade --pr <N> \
  --thread-id <ID> --body "Fixed in <sha>. <brief description>."
```

Then resolve:

```bash
gh pr-review threads resolve -R LoFi-Monk/mesh-arkade --pr <N> --thread-id <ID>
```

Batch resolves in a loop when many threads need resolving at once.

### Phase 7: Wait for Re-review

Devin re-reviews on every push. Repeat from Phase 1 until:
- All threads resolved
- CI green
- No new Bugs or Flags

---

## Tracked Deferrals

Items acknowledged as "will fix in follow-up PR":

- Hub `stop()` should close Hyperbee/Corestore (resource leak) — backlog card exists
- `getSystemDefinition` loose `.includes()` matching — backlog card exists
- CLI command handlers in `index.js` — backlog card exists

---

## Tips

- **Devin repeats itself**: Keep a mental model of what's been addressed. Reference prior threads in responses.
- **Coverage**: Fixes that change code may shift branch coverage below 80%. Always check after fixes.
- **Backticks in replies**: `gh pr-review comments reply --body` handles them fine — no escaping needed.
- **Batch operations**: Loop over thread IDs for bulk resolves rather than calling one at a time when possible.
