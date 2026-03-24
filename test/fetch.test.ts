import test from 'brittle'
import { fetchDat } from '../src/dat/index.js'

test('fetchDat returns content and metadata on successful fetch', async (t) => {
  const originalFetch = globalThis.fetch

  const mockContent = 'CLRMamePro dat file content'
  const mockHeaders = new Map([
    ['ETag', '"abc123"'],
    ['Last-Modified', 'Mon, 01 Jan 2024 00:00:00 GMT'],
    ['Content-Length', '1234'],
  ])

  globalThis.fetch = async () => {
    return {
      status: 200,
      ok: true,
      text: async () => mockContent,
      headers: mockHeaders,
    } as unknown as Response
  }

  const result = await fetchDat('Nintendo - Game Boy')

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.content, mockContent, 'content matches')
    t.is(result.etag, '"abc123"', 'etag is extracted')
    t.is(result.lastModified, 'Mon, 01 Jan 2024 00:00:00 GMT', 'lastModified is extracted')
    t.is(result.contentLength, 1234, 'contentLength is parsed as number')
  }

  globalThis.fetch = originalFetch
})

test('fetchDat URL-encodes system name', async (t) => {
  const originalFetch = globalThis.fetch
  let capturedUrl = ''

  globalThis.fetch = async (url) => {
    capturedUrl = url as string
    return {
      status: 200,
      ok: true,
      text: async () => 'content',
      headers: new Map([]),
    } as unknown as Response
  }

  await fetchDat('Nintendo - Game Boy & Game Boy Color')

  t.alike(
    capturedUrl,
    'https://raw.githubusercontent.com/libretro/libretro-database/master/dat/Nintendo%20-%20Game%20Boy%20%26%20Game%20Boy%20Color.dat',
    'system name is URL-encoded'
  )

  globalThis.fetch = originalFetch
})

test('fetchDat returns not-found error for 404 response', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      status: 404,
      ok: false,
      text: async () => 'Not Found',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await fetchDat('NonExistent System')

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'not-found', 'error type is not-found')
    t.is(result.error.url.includes('NonExistent%20System'), true, 'url is in error')
  }

  globalThis.fetch = originalFetch
})

test('fetchDat returns network-error when fetch throws', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    throw new Error('Network unavailable')
  }

  const result = await fetchDat('Nintendo - Game Boy')

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'network-error', 'error type is network-error')
    t.is(result.error.message, 'Network unavailable', 'error message is from exception')
  }

  globalThis.fetch = originalFetch
})

test('fetchDat returns not-modified for 304 response', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      status: 304,
      ok: false,
      text: async () => '',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await fetchDat('Nintendo - Game Boy')

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'not-modified', 'error type is not-modified')
  }

  globalThis.fetch = originalFetch
})

test('fetchDat sends conditional headers when provided', async (t) => {
  const originalFetch = globalThis.fetch
  let capturedHeaders: Record<string, string> = {}

  globalThis.fetch = async (url, options) => {
    capturedHeaders = options?.headers as Record<string, string> || {}
    return {
      status: 200,
      ok: true,
      text: async () => 'content',
      headers: new Map([]),
    } as unknown as Response
  }

  await fetchDat('Nintendo - Game Boy', {
    ifNoneMatch: '"abc123"',
    ifModifiedSince: 'Mon, 01 Jan 2024 00:00:00 GMT',
  })

  t.is(capturedHeaders['If-None-Match'], '"abc123"', 'If-None-Match header is set')
  t.is(
    capturedHeaders['If-Modified-Since'],
    'Mon, 01 Jan 2024 00:00:00 GMT',
    'If-Modified-Since header is set'
  )

  globalThis.fetch = originalFetch
})

test('fetchDat returns null for missing ETag and Last-Modified headers', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      status: 200,
      ok: true,
      text: async () => 'content',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await fetchDat('Nintendo - Game Boy')

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.etag, null, 'etag is null when missing')
    t.is(result.lastModified, null, 'lastModified is null when missing')
    t.is(result.contentLength, null, 'contentLength is null when missing')
  }

  globalThis.fetch = originalFetch
})

test('fetchDat handles network errors without response object', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    throw new Error('ECONNREFUSED')
  }

  const result = await fetchDat('Nintendo - Game Boy')

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'network-error', 'error type is network-error')
    t.ok(result.error.message.length > 0, 'error message is present')
  }

  globalThis.fetch = originalFetch
})