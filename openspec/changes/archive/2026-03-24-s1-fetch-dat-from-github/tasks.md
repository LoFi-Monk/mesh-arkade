## 1. Types

- [x] 1.1 Define `DatFetchResult` type: `{ ok: true, content: string, etag: string | null, lastModified: string | null, contentLength: number | null }`
- [x] 1.2 Define `DatFetchError` type: `{ ok: false, error: { type: 'not-found' | 'network-error' | 'not-modified', message: string, url: string } }`
- [x] 1.3 Define `DatFetchOptions` type: `{ ifNoneMatch?: string, ifModifiedSince?: string }`
- [x] 1.4 Export all types from `src/dat/types.ts`

## 2. Core Implementation

- [x] 2.1 Create `src/dat/fetch.ts` with `fetchDat(systemName: string, options?: DatFetchOptions): Promise<DatFetchResult | DatFetchError>`
- [x] 2.2 Construct URL: `https://raw.githubusercontent.com/libretro/libretro-database/master/dat/${encodeURIComponent(systemName)}.dat`
- [x] 2.3 Set `If-None-Match` and `If-Modified-Since` request headers when options are provided
- [x] 2.4 Handle HTTP 200: extract content via `response.text()`, read ETag/Last-Modified/Content-Length from headers, return `DatFetchResult`
- [x] 2.5 Handle HTTP 304: return `DatFetchError` with `type: 'not-modified'`
- [x] 2.6 Handle HTTP 404: return `DatFetchError` with `type: 'not-found'`
- [x] 2.7 Handle fetch throw (network failure): catch and return `DatFetchError` with `type: 'network-error'`
- [x] 2.8 Add TSDoc with `@intent`, `@guarantee`, `@constraint` tags to all exported symbols

## 3. Tests

- [x] 3.1 Create `test/fetch.test.ts` with test setup importing compat
- [x] 3.2 Test: successful fetch returns content string and metadata (mock fetch with 200 response)
- [x] 3.3 Test: system name is URL-encoded in the request URL
- [x] 3.4 Test: 404 response returns `{ ok: false, error: { type: 'not-found' } }`
- [x] 3.5 Test: network error (fetch throws) returns `{ ok: false, error: { type: 'network-error' } }`
- [x] 3.6 Test: 304 response returns `{ ok: false, error: { type: 'not-modified' } }`
- [x] 3.7 Test: conditional headers (ifNoneMatch, ifModifiedSince) are sent in the request
- [x] 3.8 Test: missing ETag/Last-Modified headers return null values
- [x] 3.9 Test: Content-Length header is parsed as number (or null if absent)

## 4. Integration & Validation

- [x] 4.1 Export `fetchDat` and types from `src/dat/index.ts` barrel file
- [x] 4.2 Run `npm run lint` — fix any errors
- [x] 4.3 Run `npm test` — all tests pass in both Node and Bare
- [x] 4.4 Run `npm run precommit` — full pipeline green