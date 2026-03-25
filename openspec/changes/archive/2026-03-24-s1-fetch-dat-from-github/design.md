## Context

S0b landed the node-compat layer — `global.fetch` is now available in both Node and Bare. This story implements the first real I/O operation: fetching a DAT file over HTTP from GitHub's raw content CDN.

The Libretro Database repo stores DAT files at a predictable URL:
`https://raw.githubusercontent.com/libretro/libretro-database/master/dat/<SystemName>.dat`

System names must match exactly (spaces and special chars URL-encoded). Files range from 1.5 MB (Game Boy) to 4+ MB (PlayStation).

## Goals / Non-Goals

**Goals:**
- Fetch a single DAT file by system name and return the raw string content
- Return HTTP metadata (ETag, Last-Modified, Content-Length) for S3 cache invalidation and S1b progress bar
- Provide typed error handling for 404 and network failures
- Full test coverage (80%+ threshold)

**Non-Goals:**
- Caching (S3 handles this)
- Progress reporting (S1b handles this)
- Parsing the DAT content (S2 handles this)
- Fetching multiple DATs in one call (future enhancement)
- Conditional fetch with If-None-Match/If-Modified-Since headers (S3 will call fetchDat with optional headers)

## Decisions

### 1. Return type: DatFetchResult object

**Choice:** Return a typed object containing `content: string`, `etag: string | null`, `lastModified: string | null`, `contentLength: number | null` rather than just a string.

**Rationale:** S3 needs ETag/Last-Modified for cache invalidation. S1b needs Content-Length for the progress bar. Returning metadata now avoids S3/S1b having to refetch headers or restructure the API later.

**Alternative considered:** Return just the string, add a separate `fetchDatHeaders()` — rejected because it would require a redundant HTTP request.

### 2. Accept optional conditional headers

**Choice:** `fetchDat(systemName, options?)` where options can include `ifNoneMatch` and `ifModifiedSince` strings.

**Rationale:** S3 will store ETag/Last-Modified from the initial fetch. On subsequent runs, S3 passes these back to `fetchDat` to get an HTTP 304 (not modified) response, avoiding a full re-download. Building this into the API now means S3 just calls `fetchDat` with extra options — no API changes needed.

### 3. Typed errors, not thrown exceptions

**Choice:** Return a discriminated union: `DatFetchResult | DatFetchError` where errors have a `type` field (`'not-found' | 'network-error' | 'not-modified'`).

**Rationale:** Thrown exceptions don't compose well in pipelines and lose type information. A discriminated union forces callers to handle all cases. `not-modified` (HTTP 304) is a success case from S3's perspective, not an error — modeling it as a return variant is more accurate.

### 4. URL construction

**Choice:** URL-encode the system name and construct the GitHub raw URL in the fetch function. No separate URL builder.

**Rationale:** The URL pattern is a single template with one variable. Extracting a builder is premature abstraction for a one-liner.

## Risks / Trade-offs

- **[Risk] GitHub raw CDN could be down or rate-limited** → Mitigation: GitHub raw content is served via Fastly CDN and is not subject to API rate limits. Transient failures are possible but rare. No retry logic in S1 — retry belongs in a higher-level orchestrator.
- **[Risk] System name mismatch gives silent 404** → Mitigation: Return a typed `not-found` error with the attempted URL so the caller can diagnose. Future: a system name index (S1 side quest) would validate names before fetching.
- **[Risk] Large responses (4+ MB) could be slow** → Mitigation: S1 returns the full response as a string. Streaming is deferred to S1b (progress bar). For S1, awaiting `response.text()` is sufficient.
