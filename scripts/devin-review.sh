#!/usr/bin/env bash
# devin-review.sh — Automate Devin PR review triage, reply, and resolve
#
# Usage:
#   bash scripts/devin-review.sh fetch [PR_NUMBER]
#   bash scripts/devin-review.sh reply <comment_id> <body_file>
#   bash scripts/devin-review.sh resolve [PR_NUMBER]

set -euo pipefail

THREADS_FILE="/tmp/devin-threads.txt"
DEVIN_LOGIN="devin-ai-integration"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

die() { echo "ERROR: $*" >&2; exit 1; }

detect_pr() {
  gh pr view --json number -q .number 2>/dev/null || die "Could not detect PR number. Pass it explicitly."
}

get_owner_repo() {
  gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"'
}

severity_icon() {
  local body="$1"
  if echo "$body" | grep -qi "🔴\|critical\|bug\|error\|broken"; then
    echo "🔴"
  elif echo "$body" | grep -qi "🟡\|warning\|should\|flag\|concern"; then
    echo "🟡"
  else
    echo "📝"
  fi
}

strip_badges() {
  # Remove HTML <img> tags (badge markup Devin injects)
  sed 's/<img[^>]*>//g'
}

# ---------------------------------------------------------------------------
# fetch
# ---------------------------------------------------------------------------

cmd_fetch() {
  local pr="${1:-}"
  [[ -z "$pr" ]] && pr=$(detect_pr)

  local owner_repo
  owner_repo=$(get_owner_repo)
  local owner="${owner_repo%%/*}"
  local repo="${owner_repo##*/}"

  echo "Fetching Devin review threads for PR #${pr} (${owner_repo})..."

  # Single GraphQL query: all unresolved threads with full comment data
  local threads
  threads=$(gh api graphql -f query="
  {
    repository(owner: \"${owner}\", name: \"${repo}\") {
      pullRequest(number: ${pr}) {
        reviewThreads(first: 50) {
          nodes {
            id
            isResolved
            comments(first: 10) {
              nodes {
                databaseId
                author { login }
                path
                line
                originalLine
                body
              }
            }
          }
        }
      }
    }
  }" --jq '[
    .data.repository.pullRequest.reviewThreads.nodes[]
    | select(
        .isResolved == false
        and (.comments.nodes[] | select(.author.login == "'"${DEVIN_LOGIN}"'")) != null
      )
  ]')

  local thread_count
  thread_count=$(echo "$threads" | jq 'length')
  echo "Unresolved Devin threads: ${thread_count}"

  # Save thread node IDs for resolve subcommand
  echo "$threads" | jq -r '.[].id' > "$THREADS_FILE"
  echo "Thread IDs saved to ${THREADS_FILE}"
  echo ""

  # Print triage dump
  local printed=0
  while IFS= read -r thread; do
    local thread_id comment_id path line body

    thread_id=$(echo "$thread" | jq -r '.id')

    # Find the Devin comment within the thread
    local devin_comment
    devin_comment=$(echo "$thread" | jq -c --arg login "${DEVIN_LOGIN}" \
      '[.comments.nodes[] | select(.author.login == $login)] | .[0]')

    comment_id=$(echo "$devin_comment" | jq -r '.databaseId')
    path=$(echo "$devin_comment" | jq -r '.path')
    line=$(echo "$devin_comment" | jq -r '.line // .originalLine // "?"')
    body=$(echo "$devin_comment" | jq -r '.body' | strip_badges)

    local icon
    icon=$(severity_icon "$body")

    local title
    title=$(echo "$body" | grep -m1 '\*\*' | sed 's/.*\*\*\(.*\)\*\*.*/\1/' || echo "(no title)")

    echo "=== THREAD ${thread_id} ==="
    echo "Comment ID: ${comment_id}"
    echo "File: ${path}:${line}"
    echo "Severity: ${icon}"
    echo "Title: ${title}"
    echo "Body:"
    echo "$body"
    echo ""
    printed=$((printed + 1))
  done < <(echo "$threads" | jq -c '.[]')

  echo "--- ${printed} unresolved Devin thread(s) printed ---"
}

# ---------------------------------------------------------------------------
# reply
# ---------------------------------------------------------------------------

cmd_reply() {
  local comment_id="${1:-}"
  local body_file="${2:-}"
  local pr="${3:-}"
  [[ -z "$comment_id" ]] && die "Usage: reply <comment_id> <body_file> [PR_NUMBER]"
  [[ -z "$body_file" ]]  && die "Usage: reply <comment_id> <body_file> [PR_NUMBER]"
  [[ -f "$body_file" ]]  || die "Body file not found: ${body_file}"
  [[ -z "$pr" ]] && pr=$(detect_pr)

  local owner_repo
  owner_repo=$(get_owner_repo)
  local owner="${owner_repo%%/*}"
  local repo="${owner_repo##*/}"

  echo "Posting reply to comment ${comment_id} on PR #${pr}..."

  # Use --input to bypass all shell string interpolation — fixes backtick escaping
  jq -n --rawfile body "$body_file" '{"body": $body}' \
    | gh api "repos/${owner}/${repo}/pulls/${pr}/comments/${comment_id}/replies" --input -

  echo "Reply posted."
}

# ---------------------------------------------------------------------------
# resolve
# ---------------------------------------------------------------------------

cmd_resolve() {
  local pr="${1:-}"
  [[ -z "$pr" ]] && pr=$(detect_pr)

  local owner_repo
  owner_repo=$(get_owner_repo)
  local owner="${owner_repo%%/*}"
  local repo="${owner_repo##*/}"

  # Re-fetch unresolved IDs if cache file is absent
  if [[ ! -f "$THREADS_FILE" ]]; then
    echo "Thread cache not found — re-fetching unresolved thread IDs..."
    gh api graphql -f query="
    {
      repository(owner: \"${owner}\", name: \"${repo}\") {
        pullRequest(number: ${pr}) {
          reviewThreads(first: 50) {
            nodes {
              id
              isResolved
            }
          }
        }
      }
    }" --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id' \
      > "$THREADS_FILE"
  fi

  local count=0
  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    echo "Resolving thread ${id}..."
    gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"${id}\"}) { thread { isResolved } } }" \
      --jq '.data.resolveReviewThread.thread.isResolved'
    count=$((count + 1))
  done < "$THREADS_FILE"

  echo "Resolved ${count} thread(s)."
  rm -f "$THREADS_FILE"
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

CMD="${1:-}"
shift || true

case "$CMD" in
  fetch)   cmd_fetch "$@" ;;
  reply)   cmd_reply "$@" ;;
  resolve) cmd_resolve "$@" ;;
  *)
    echo "Usage: bash scripts/devin-review.sh <fetch|reply|resolve> [args]"
    echo ""
    echo "  fetch [PR_NUMBER]              Triage unresolved Devin threads"
    echo "  reply <comment_id> <body_file> Post a reply from a file (no escaping issues)"
    echo "  resolve [PR_NUMBER]            Resolve all cached unresolved threads"
    exit 1
    ;;
esac
