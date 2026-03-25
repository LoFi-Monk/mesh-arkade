import test from 'brittle'
import { fetchSystemIndex, resolveSystemName } from '../src/dat/index.js'

const mockSystems = [
  'Nintendo - Game Boy',
  'Nintendo - Game Boy Color',
  'Nintendo - Game Boy Advance',
  'Nintendo - Nintendo Entertainment System',
  'Nintendo - Super Nintendo Entertainment System',
  'Sega - Game Gear',
  'Sega - Genesis',
  'Atari - 2600',
]

test('fetchSystemIndex returns system names on successful fetch', async (t) => {
  const originalFetch = globalThis.fetch

  const mockData = [
    { name: 'Nintendo - Game Boy.dat', type: 'file' },
    { name: 'Nintendo - Game Boy Color.dat', type: 'file' },
    { name: 'Some Folder', type: 'dir' },
    { name: 'README.md', type: 'file' },
  ]

  globalThis.fetch = async () => {
    return {
      status: 200,
      ok: true,
      json: async () => mockData,
    } as unknown as Response
  }

  const result = await fetchSystemIndex()

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.systems.length, 2, 'only .dat files are included')
    t.is(result.systems[0], 'Nintendo - Game Boy', 'extension is stripped')
    t.is(result.systems[1], 'Nintendo - Game Boy Color', 'extension is stripped')
  }

  globalThis.fetch = originalFetch
})

test('fetchSystemIndex filters out non-file entries', async (t) => {
  const originalFetch = globalThis.fetch

  const mockData = [
    { name: 'Nintendo - Game Boy.dat', type: 'file' },
    { name: 'Sega - Genesis.dat', type: 'file' },
    { name: 'subdir', type: 'dir' },
  ]

  globalThis.fetch = async () => {
    return {
      status: 200,
      ok: true,
      json: async () => mockData,
    } as unknown as Response
  }

  const result = await fetchSystemIndex()

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.systems.length, 2, 'only files are included')
    t.absent(result.systems.includes('subdir'), 'directories are excluded')
  }

  globalThis.fetch = originalFetch
})

test('fetchSystemIndex filters out non-.dat files', async (t) => {
  const originalFetch = globalThis.fetch

  const mockData = [
    { name: 'Nintendo - Game Boy.dat', type: 'file' },
    { name: 'README.md', type: 'file' },
    { name: 'LICENSE.txt', type: 'file' },
  ]

  globalThis.fetch = async () => {
    return {
      status: 200,
      ok: true,
      json: async () => mockData,
    } as unknown as Response
  }

  const result = await fetchSystemIndex()

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.systems.length, 1, 'only .dat files are included')
    t.is(result.systems[0], 'Nintendo - Game Boy')
  }

  globalThis.fetch = originalFetch
})

test('fetchSystemIndex returns rate-limited error for 403 response', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      status: 403,
      ok: false,
    } as unknown as Response
  }

  const result = await fetchSystemIndex()

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'rate-limited', 'error type is rate-limited')
    t.ok(result.error.url.length > 0, 'url is present in error')
  }

  globalThis.fetch = originalFetch
})

test('fetchSystemIndex returns network-error when fetch throws', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    throw new Error('Network unavailable')
  }

  const result = await fetchSystemIndex()

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'network-error', 'error type is network-error')
    t.is(result.error.message, 'Network unavailable', 'error message is from exception')
  }

  globalThis.fetch = originalFetch
})

test('resolveSystemName returns matching system names', async (t) => {
  const result = resolveSystemName('Sega - Genesis', mockSystems)

  t.is(result.length, 1, 'returns one match')
  t.is(result[0], 'Sega - Genesis')
})

test('resolveSystemName returns matching system names - NES', async (t) => {
  const result = resolveSystemName('Super Nintendo', mockSystems)

  t.is(result.length, 1, 'returns one match')
  t.is(result[0], 'Nintendo - Super Nintendo Entertainment System')
})

test('resolveSystemName is case-insensitive', async (t) => {
  const resultLower = resolveSystemName('nes', mockSystems)
  const resultUpper = resolveSystemName('NES', mockSystems)
  const resultMixed = resolveSystemName('NeS', mockSystems)

  t.is(resultLower.length, 1, 'lowercase query works')
  t.is(resultUpper.length, 1, 'uppercase query works')
  t.is(resultMixed.length, 1, 'mixed case query works')
  t.alike(resultLower, resultUpper, 'case variations return same results')
})

test('resolveSystemName returns multiple matches for ambiguous query', async (t) => {
  const result = resolveSystemName('Game Boy', mockSystems)

  t.is(result.length, 3, 'returns three matches')
  t.ok(result.includes('Nintendo - Game Boy'))
  t.ok(result.includes('Nintendo - Game Boy Color'))
  t.ok(result.includes('Nintendo - Game Boy Advance'))
})

test('resolveSystemName returns empty array for no matches', async (t) => {
  const result = resolveSystemName('nonexistent', mockSystems)

  t.is(result.length, 0, 'returns empty array')
  t.is(Array.isArray(result), true, 'result is always an array')
})

test('resolveSystemName matches substring anywhere in system name', async (t) => {
  const result = resolveSystemName('Genesis', mockSystems)

  t.is(result.length, 1)
  t.is(result[0], 'Sega - Genesis')
})

test('resolveSystemName matches partial system names', async (t) => {
  const result = resolveSystemName('2600', mockSystems)

  t.is(result.length, 1)
  t.is(result[0], 'Atari - 2600')
})