import test from 'brittle'
import { mergeDat, parseRegion } from '../src/dat/merge.js'

const mainDatFixture = `clrmamepro (
	name "Nintendo - Nintendo Entertainment System"
	description "Nintendo - Nintendo Entertainment System"
	author "Libretro"
)

game (
	name "Donkey Kong (USA)"
	rom ( name "donkeykong.nes" size 24576 crc 6B0C2D41 )
)

game (
	name "Donkey Kong (Europe)"
	rom ( name "donkeykong.nes" size 24576 crc 6B0C2D42 )
)

game (
	name "Metroid (Japan, USA)"
	rom ( name "metroid.nes" size 262144 crc 45534F58 )
)

game (
	name "Super Mario Bros. (World)"
	rom ( name "smb.nes" size 40960 crc AABBCCDD )
)

game (
	name "Tetris (Rev A)"
	rom ( name "tetris.nes" size 4096 crc DDEEFF00 )
)

game (
	name "Game With No Region"
	rom ( name "noregion.nes" size 1024 crc 11223344 )
)`

const developerDatFixture = `clrmamepro (
	name "Nintendo - NES Developer"
)

game (
	comment "Donkey Kong"
	name "Nintendo"
)

game (
	comment "Metroid"
	name "Nintendo R&D1"
)

game (
	comment "Super Mario Bros."
	name "Nintendo"
)`

const genreDatFixture = `clrmamepro (
	name "Nintendo - NES Genre"
)

game (
	comment "Donkey Kong"
	name "Platformer"
)

game (
	comment "Metroid"
	name "Action-Adventure"
)

game (
	comment "Super Mario Bros."
	name "Platformer"
)`

const releaseyearDatFixture = `clrmamepro (
	name "Nintendo - NES Release Year"
)

game (
	comment "Donkey Kong"
	name "1985"
)

game (
	comment "Metroid"
	name "1986"
)

game (
	comment "Super Mario Bros."
	name "1985"
)`

const publisherDatFixture = `clrmamepro (
	name "Nintendo - NES Publisher"
)

game (
	comment "Donkey Kong"
	name "Nintendo"
)

game (
	comment "Metroid"
	name "Nintendo"
)

game (
	comment "Super Mario Bros."
	name "Nintendo"
)`

test('parseRegion extracts single region from game name', (t) => {
  t.is(parseRegion('Donkey Kong (USA)'), 'USA')
  t.is(parseRegion('Game (Europe)'), 'Europe')
  t.is(parseRegion('Game (Japan)'), 'Japan')
  t.is(parseRegion('Game (World)'), 'World')
})

test('parseRegion extracts multiple regions from game name', (t) => {
  t.is(parseRegion('Metroid (Japan, USA)'), 'Japan, USA')
  t.is(parseRegion('Game (Europe, USA)'), 'Europe, USA')
})

test('parseRegion returns null for no region', (t) => {
  t.is(parseRegion('Tetris (Rev A)'), null)
  t.is(parseRegion('Game With No Region'), null)
  t.is(parseRegion('Game'), null)
})

test('parseRegion ignores non-region parentheticals', (t) => {
  t.is(parseRegion('Tetris (Rev A)'), null)
  t.is(parseRegion('Game (Unl)'), null)
  t.is(parseRegion('Game (Demo)'), null)
  t.is(parseRegion('Game (Beta)'), null)
  t.is(parseRegion('Game (Proto)'), null)
})

test('parseRegion is case-insensitive', (t) => {
  t.is(parseRegion('Game (usa)'), 'USA')
  t.is(parseRegion('Game (USA)'), 'USA')
  t.is(parseRegion('Game (Usa)'), 'USA')
})

test('mergeDat fetches and merges main DAT with supplementary', async (t) => {
  const originalFetch = globalThis.fetch

  const mockMainDat = mainDatFixture
  const mockDeveloperDat = developerDatFixture
  const mockGenreDat = genreDatFixture
  const mockReleaseyearDat = releaseyearDatFixture
  const mockPublisherDat = publisherDatFixture

  globalThis.fetch = async (url) => {
    const urlStr = url as string

    if (urlStr.includes('/dat/')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockMainDat,
        headers: new Map([]),
      } as unknown as Response
    }

    if (urlStr.includes('/metadat/developer')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockDeveloperDat,
        headers: new Map([]),
      } as unknown as Response
    }

    if (urlStr.includes('/metadat/genre')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockGenreDat,
        headers: new Map([]),
      } as unknown as Response
    }

    if (urlStr.includes('/metadat/releaseyear')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockReleaseyearDat,
        headers: new Map([]),
      } as unknown as Response
    }

    if (urlStr.includes('/metadat/publisher')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockPublisherDat,
        headers: new Map([]),
      } as unknown as Response
    }

    return {
      status: 404,
      ok: false,
      text: async () => 'Not Found',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await mergeDat('Nintendo - NES')

  t.is(result.ok, true)

  if (result.ok) {
    t.is(result.mainDat.games.length, 6)

    const dk = result.mainDat.games.find((g) => g.name.includes('Donkey Kong (USA)'))
    t.ok(dk)
    if (dk && dk.roms[0]) {
      t.is(dk.roms[0].developer, 'Nintendo', 'developer enriched')
      t.is(dk.roms[0].genre, 'Platformer', 'genre enriched')
      t.is(dk.roms[0].releaseyear, '1985', 'releaseyear enriched')
      t.is(dk.roms[0].publisher, 'Nintendo', 'publisher enriched')
      t.is(dk.roms[0].region, 'USA', 'region extracted')
    }

    const metroid = result.mainDat.games.find((g) => g.name.includes('Metroid'))
    t.ok(metroid)
    if (metroid && metroid.roms[0]) {
      t.is(metroid.roms[0].developer, 'Nintendo R&D1', 'developer enriched')
      t.is(metroid.roms[0].genre, 'Action-Adventure', 'genre enriched')
      t.is(metroid.roms[0].releaseyear, '1986', 'releaseyear enriched')
      t.is(metroid.roms[0].region, 'Japan, USA', 'region extracted')
    }

    const smb = result.mainDat.games.find((g) => g.name.includes('Super Mario Bros'))
    t.ok(smb)
    if (smb && smb.roms[0]) {
      t.is(smb.roms[0].region, 'World', 'region extracted')
    }

    const tetris = result.mainDat.games.find((g) => g.name.includes('Tetris'))
    t.ok(tetris)
    if (tetris && tetris.roms[0]) {
      t.is(tetris.roms[0].region, undefined, 'no region for Rev A')
    }

    const noRegion = result.mainDat.games.find((g) => g.name.includes('Game With No Region'))
    t.ok(noRegion)
    if (noRegion && noRegion.roms[0]) {
      t.is(noRegion.roms[0].region, undefined, 'no region for game without region')
    }
  }

  globalThis.fetch = originalFetch
})

test('mergeDat handles missing supplementary DAT gracefully', async (t) => {
  const originalFetch = globalThis.fetch

  const mockMainDat = mainDatFixture

  globalThis.fetch = async (url) => {
    const urlStr = url as string
    // Main DAT succeeds, supplementary fails with 404
    if (urlStr.includes('/dat/')) {
      return {
        status: 200,
        ok: true,
        text: async () => mockMainDat,
        headers: new Map([]),
      } as unknown as Response
    }
    return {
      status: 404,
      ok: false,
      text: async () => 'Not Found',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await mergeDat('Nintendo - NES')

  t.is(result.ok, true)

  if (result.ok) {
    t.is(result.mainDat.games.length, 6)
    t.is(result.supplementary.length, 0, 'supplementary empty when all fail')
  }

  globalThis.fetch = originalFetch
})

test('mergeDat handles supplementary fetch failure gracefully', async (t) => {
  const originalFetch = globalThis.fetch

  const mockMainDat = mainDatFixture

  let callCount = 0
  globalThis.fetch = async () => {
    callCount++
    if (callCount === 1) {
      return {
        status: 200,
        ok: true,
        text: async () => mockMainDat,
        headers: new Map([]),
      } as unknown as Response
    }

    return {
      status: 500,
      ok: false,
      text: async () => 'Server Error',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await mergeDat('Nintendo - NES')

  t.is(result.ok, true)

  if (result.ok) {
    t.is(result.mainDat.games.length, 6)
  }

  globalThis.fetch = originalFetch
})

test('mergeDat returns error when main DAT fetch fails', async (t) => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      status: 404,
      ok: false,
      text: async () => 'Not Found',
      headers: new Map([]),
    } as unknown as Response
  }

  const result = await mergeDat('NonExistent System')

  t.is(result.ok, false)
  if (!result.ok) {
    t.is(result.error.type, 'fetch-error')
  }

  globalThis.fetch = originalFetch
})
