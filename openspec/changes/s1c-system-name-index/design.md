## Context

`fetchDat(systemName)` requires exact Libretro system names like `"Nintendo - Nintendo Entertainment System"`. Users will never type that. Before any user-facing system selection (the "Open the ARKive" flow, S3 managed systems), we need two capabilities:

1. **Discovery** — what systems exist in the Libretro Database?
2. **Resolution** — given user input ("NES"), which exact system name does that map to?

The GitHub Contents API (`/repos/:owner/:repo/contents/:path`) returns directory listings as JSON, including each file's `name`. The `/dat/` directory contains ~200+ `.dat` files — each filename (minus extension) is a canonical system name.

## Goals / Non-Goals

**Goals:**
- Fetch the list of available system names from Libretro Database at runtime
- Resolve user-friendly input to canonical system names via case-insensitive substring matching
- Follow the same error-handling pattern as `fetchDat()` (discriminated union, no throws)
- Keep the index stateless — fetch it fresh when needed, no persistence (that's S3's job)

**Non-Goals:**
- Caching or persisting the index (deferred to S3 / Hyperbee)
- Fuzzy matching or typo correction (future enhancement)
- Mapping unofficial aliases like "Famicom" → NES (future enhancement)
- Fetching any data beyond system names (no DAT content, no metadata)

## Decisions

### 1. Use GitHub Contents API, not raw directory scraping

**Decision:** Use `https://api.github.com/repos/libretro/libretro-database/contents/dat` which returns structured JSON with `name` and `type` fields.

**Alternative considered:** Scrape the raw GitHub HTML directory listing. Rejected — fragile, no stable contract, breaks on layout changes.

**Rationale:** The Contents API returns a stable JSON array of `{ name, type, sha, ... }` objects. We only need `name` and `type: "file"`. The API is unauthenticated for public repos with a 60 req/hour limit — more than sufficient for an index that refreshes at most once per session.

### 2. Parse system names from filenames

**Decision:** Strip `.dat` extension from each file entry to get the canonical system name. No transformation, no normalization — the filename IS the name.

**Rationale:** Libretro's naming convention is authoritative. `"Nintendo - Nintendo Entertainment System.dat"` → `"Nintendo - Nintendo Entertainment System"`. This matches what `fetchDat()` expects as input.

### 3. Case-insensitive substring matching for resolution

**Decision:** `resolveSystemName(query, index)` finds all system names where `name.toLowerCase()` contains `query.toLowerCase()`. Returns an array (zero, one, or many matches).

**Alternative considered:** Exact match only. Rejected — users will type "NES", "gameboy", "snes", which must resolve to the canonical form.

**Alternative considered:** Fuzzy matching (Levenshtein distance). Rejected for now — adds complexity, hard to get right without testing against real user input patterns. Substring matching covers the common cases. Can be upgraded later.

**Rationale:** Substring matching handles "NES" matching "Nintendo - Nintendo Entertainment System", "Game Boy" matching "Nintendo - Game Boy", etc. When multiple matches occur (e.g., "Game Boy" matches both "Game Boy" and "Game Boy Advance" and "Game Boy Color"), the caller gets all matches and can prompt the user to disambiguate.

### 4. Same error pattern as fetchDat()

**Decision:** Return a discriminated union — `{ ok: true, systems: string[] }` or `{ ok: false, error: { type, message, url } }`. Reuse error types where applicable (`network-error`). Add `rate-limited` for the GitHub API 403 case.

**Rationale:** Consistency with S1. Callers already know this pattern.

## Risks / Trade-offs

**[GitHub API rate limit: 60 req/hour unauthenticated]** → Sufficient for our use case. The index is fetched once per session at most. If rate-limited, return a typed `rate-limited` error so the caller can show a meaningful message. Document this limit.

**[Large directory response: ~200+ entries]** → The Contents API returns all entries in a single response for directories under 1,000 files. The `/dat/` directory is well within this limit. No pagination needed.

**[API response shape changes]** → GitHub's Contents API is stable and widely used. Pin to the fields we need (`name`, `type`) and ignore the rest. If the API breaks, the error handling catches it.

**[Substring ambiguity]** → "Game Boy" matches 3 systems. This is by design — the caller disambiguates. Single-match cases ("NES", "Genesis", "PlayStation") resolve cleanly.
