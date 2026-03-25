import test from 'brittle'
import { parseDat } from '../src/dat/index.js'

const nesDatFixture = `clrmamepro (
	name "Nintendo - Nintendo Entertainment System"
	description "Nintendo - Nintendo Entertainment System"
	version "20240101"
	author "Libretro"
	homepage "https://github.com/libretro/libretro-database"
)

game (
	name "Donkey Kong"
	description "Donkey Kong"
	rom ( name "donkeykong.nes" size 24576 crc 6B0C2D41 )
)

game (
	name "Donkey Kong Junior"
	description "Donkey Kong Junior"
	rom ( name "donkeykongjr.nes" size 24576 crc F5A52E62 )
)

game (
	name "Metroid"
	description "Metroid"
	comment "(E) [!]"
	rom ( name "metroid.nes" size 262144 crc 45534F58 md5 000ff97bbb2ed14e6772e75320b5dfa4 sha1 4c1c6a4d7c7d7eb2e51c7d2d25f50506e8c6a9f )
)`

const multiRomFixture = `clrmamepro (
	name "Sony - PlayStation"
	description "Sony - PlayStation BIOS"
	author "Libretro"
)

game (
	name "Sony PlayStation BIOS"
	description "Sony PlayStation BIOS"
	rom ( name "scph5500.bin" size 524288 crc 8d2c3f25 md5 490c3c58a3376bb5d0c3a1df0c10f42 sha1 0ffa65f2bf858f8c7b1b43d5bbd1d5699af39e38 )
	rom ( name "scph5501.bin" size 524288 crc 5a8c4b3d md5 627e1c66676f6d3a2d6a3d1c1c3c4c5c6c7c8c9 sha1 1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 )
)`

const minimalFixture = `clrmamepro (
	name "Test System"
)

game (
	name "Test Game"
	rom ( name "test.gb" size 1024 )
)`

const serialFixture = `clrmamepro (
	name "Sega - Mega Drive"
	description "Sega - Mega Drive"
	author "Libretro"
)

game (
	name "Sonic the Hedgehog"
	description "Sonic the Hedgehog"
	rom ( name "sonic.bin" size 524288 crc AB52F93C serial "GM 00000000-00" )
)`

const malformedMissingParen = `clrmamepro (
	name "Test"
	game (
		name "Game1"
		rom ( name "game1.rom" size 1024 crc AABBCCDD )
`

const malformedEmpty = ``

const headerOnlyFixture = `clrmamepro (
	name "Empty System"
	description "No games yet"
	version "1.0"
)`

test('successful parse returns { ok: true } with correct header fields', (t) => {
  const result = parseDat(nesDatFixture)

  t.is(result.ok, true, 'result is ok')
  if (result.ok) {
    t.is(result.dat.header.name, 'Nintendo - Nintendo Entertainment System', 'header name extracted')
    t.is(result.dat.header.description, 'Nintendo - Nintendo Entertainment System', 'header description extracted')
    t.is(result.dat.header.version, '20240101', 'header version extracted')
    t.is(result.dat.header.author, 'Libretro', 'header author extracted')
    t.is(result.dat.header.homepage, 'https://github.com/libretro/libretro-database', 'header homepage extracted')
  }
})

test('header (...) block parsed identically to clrmamepro (...)', (t) => {
  const clrmameproContent = `clrmamepro ( name "Test" )`
  const headerContent = `header ( name "Test" )`

  const clrmameproResult = parseDat(clrmameproContent)
  const headerResult = parseDat(headerContent)

  t.is(clrmameproResult.ok, true)
  t.is(headerResult.ok, true)

  if (clrmameproResult.ok && headerResult.ok) {
    t.is(clrmameproResult.dat.header.name, headerResult.dat.header.name)
  }
})

test('optional header fields (homepage, url) are undefined when absent', (t) => {
  const result = parseDat(minimalFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.header.name, 'Test System')
    t.is(result.dat.header.description, undefined, 'description is undefined')
    t.is(result.dat.header.version, undefined, 'version is undefined')
    t.is(result.dat.header.author, undefined, 'author is undefined')
    t.is(result.dat.header.homepage, undefined, 'homepage is undefined')
    t.is(result.dat.header.url, undefined, 'url is undefined')
  }
})

test('games array contains all game entries with correct names', (t) => {
  const result = parseDat(nesDatFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.games.length, 3, '3 games parsed')
    t.is(result.dat.games[0]?.name, 'Donkey Kong')
    t.is(result.dat.games[1]?.name, 'Donkey Kong Junior')
    t.is(result.dat.games[2]?.name, 'Metroid')
  }
})

test('single ROM per game - all fields extracted (name, size, crc, md5, sha1)', (t) => {
  const result = parseDat(nesDatFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const metroid = result.dat.games.find((g) => g.name === 'Metroid')
    t.ok(metroid, 'Metroid game found')
    if (metroid) {
      t.is(metroid.roms.length, 1, '1 ROM in Metroid')
      const rom = metroid.roms[0]
      t.is(rom?.name, 'metroid.nes', 'ROM name extracted')
      t.is(rom?.size, 262144, 'ROM size extracted')
      t.is(rom?.crc, '45534F58', 'CRC extracted and uppercased')
      t.is(rom?.md5, '000FF97BBB2ED14E6772E75320B5DFA4', 'MD5 extracted and uppercased')
      t.is(rom?.sha1, '4C1C6A4D7C7D7EB2E51C7D2D25F50506E8C6A9F', 'SHA1 extracted and uppercased')
    }
  }
})

test('multiple ROMs per game - game.roms array has correct length and order', (t) => {
  const result = parseDat(multiRomFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const bios = result.dat.games[0]
    t.ok(bios, 'BIOS game found')
    if (bios) {
      t.is(bios.roms.length, 2, '2 ROMs in BIOS game')
      t.is(bios.roms[0]?.name, 'scph5500.bin', 'first ROM name')
      t.is(bios.roms[1]?.name, 'scph5501.bin', 'second ROM name')
    }
  }
})

test('inline ROM on single line parsed correctly', (t) => {
  const inlineFixture = `clrmamepro ( name "Test" )
game ( name "Game1" rom ( name "test.nes" size 4096 crc AABBCCDD ) )`

  const result = parseDat(inlineFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.games.length, 1)
    t.is(result.dat.games[0]?.roms.length, 1)
    t.is(result.dat.games[0]?.roms[0]?.name, 'test.nes')
  }
})

test('optional game fields (description, comment) present when specified, undefined when absent', (t) => {
  const result = parseDat(nesDatFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const dk = result.dat.games.find((g) => g.name === 'Donkey Kong')
    t.ok(dk)
    if (dk) {
      t.is(dk.description, 'Donkey Kong')
      t.is(dk.comment, undefined, 'comment is undefined when absent')
    }

    const metroid = result.dat.games.find((g) => g.name === 'Metroid')
    t.ok(metroid)
    if (metroid) {
      t.is(metroid.description, 'Metroid')
      t.is(metroid.comment, '(E) [!]', 'comment extracted')
    }
  }
})

test('ROM with CRC only - md5 and sha1 are undefined', (t) => {
  const crcOnlyFixture = `clrmamepro ( name "Test" )
game ( name "Game1" rom ( name "test.nes" size 4096 crc AABBCCDD ) )`

  const result = parseDat(crcOnlyFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const rom = result.dat.games[0]?.roms[0]
    t.is(rom?.crc, 'AABBCCDD')
    t.is(rom?.md5, undefined, 'md5 is undefined when not present')
    t.is(rom?.sha1, undefined, 'sha1 is undefined when not present')
  }
})

test('ROM with no checksums - all checksum fields undefined', (t) => {
  const result = parseDat(minimalFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const rom = result.dat.games[0]?.roms[0]
    t.is(rom?.crc, undefined)
    t.is(rom?.md5, undefined)
    t.is(rom?.sha1, undefined)
  }
})

test('serial field extracted when present, undefined when absent', (t) => {
  const result = parseDat(serialFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const rom = result.dat.games[0]?.roms[0]
    t.is(rom?.serial, 'GM 00000000-00', 'serial extracted')

    const result2 = parseDat(minimalFixture)
    if (result2.ok) {
      const rom2 = result2.dat.games[0]?.roms[0]
      t.is(rom2?.serial, undefined, 'serial undefined when absent')
    }
  }
})

test('checksums normalized to uppercase (mixed-case input -> uppercase output)', (t) => {
  const mixedCaseFixture = `clrmamepro ( name "Test" )
game ( name "Game" rom ( name "test.nes" size 4096 crc aabbccdd md5 aabbccddeeff00112233445566778899 sha1 aabbccddeeff00112233445566778899aabbccdd ) )`

  const result = parseDat(mixedCaseFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const rom = result.dat.games[0]?.roms[0]
    t.is(rom?.crc, 'AABBCCDD', 'CRC uppercased')
    t.is(rom?.md5, 'AABBCCDDEEFF00112233445566778899', 'MD5 uppercased')
    t.is(rom?.sha1, 'AABBCCDDEEFF00112233445566778899AABBCCDD', 'SHA1 uppercased')
  }
})

test('size parsed as number, not string', (t) => {
  const result = parseDat(nesDatFixture)

  t.is(result.ok, true)
  if (result.ok) {
    const rom = result.dat.games[0]?.roms[0]
    t.is(typeof rom?.size, 'number', 'size is a number')
    t.is(rom?.size, 24576)
  }
})

test('\\r\\n line endings produce same result as \\n', (t) => {
  const withCRLF = 'clrmamepro (\r\n\tname "Test"\r\n)\r\ngame (\r\n\tname "Game1"\r\n\trom ( name "test.nes" size 4096 crc AABBCCDD )\r\n)'

  const withLF = 'clrmamepro (\n\tname "Test"\n)\ngame (\n\tname "Game1"\n\trom ( name "test.nes" size 4096 crc AABBCCDD )\n)'

  const resultCRLF = parseDat(withCRLF)
  const resultLF = parseDat(withLF)

  t.is(resultCRLF.ok, true)
  t.is(resultLF.ok, true)

  if (resultCRLF.ok && resultLF.ok) {
    t.is(resultCRLF.dat.header.name, resultLF.dat.header.name)
    t.is(resultCRLF.dat.games[0]?.name, resultLF.dat.games[0]?.name)
    t.is(resultCRLF.dat.games[0]?.roms[0]?.crc, resultLF.dat.games[0]?.roms[0]?.crc)
  }
})

test('quoted strings with parentheses - "Tetris (World) (Rev 1)" parsed as single value', (t) => {
  const quotedParenFixture = `clrmamepro ( name "Test (Special)" )
game ( name "Tetris (World) (Rev 1)" description "Tetris (World) (Rev 1)" rom ( name "tetris.nes" size 4096 crc AABBCCDD ) )`

  const result = parseDat(quotedParenFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.header.name, 'Test (Special)')
    t.is(result.dat.games[0]?.name, 'Tetris (World) (Rev 1)')
    t.is(result.dat.games[0]?.description, 'Tetris (World) (Rev 1)')
  }
})

test('unknown fields ignored silently', (t) => {
  const unknownFieldsFixture = `clrmamepro ( name "Test" unknownfield "ignored" )
game ( name "Game1" unknowngamefield "ignored" status "good" region "USA" rom ( name "test.nes" size 4096 crc AABBCCDD language "English" ) )`

  const result = parseDat(unknownFieldsFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.header.name, 'Test')
    t.is(result.dat.games[0]?.name, 'Game1')
    t.is(result.dat.games[0]?.roms[0]?.name, 'test.nes')
  }
})

test('header-only DAT (no games) returns { ok: true } with empty games array', (t) => {
  const result = parseDat(headerOnlyFixture)

  t.is(result.ok, true)
  if (result.ok) {
    t.is(result.dat.header.name, 'Empty System')
    t.is(result.dat.games.length, 0, 'empty games array')
  }
})

test('malformed content returns { ok: false, error: { type: parse-error } } with message', (t) => {
  const result = parseDat(malformedMissingParen)

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'parse-error')
    t.ok(result.error.message.length > 0, 'error message is present')
  }
})

test('empty string input returns appropriate error', (t) => {
  const result = parseDat(malformedEmpty)

  t.is(result.ok, false, 'result is not ok')
  if (!result.ok) {
    t.is(result.error.type, 'parse-error')
    t.is(result.error.message, 'Empty input')
  }
})

test('missing required header name returns error', (t) => {
  const noNameFixture = `clrmamepro ( description "No name field" )`

  const result = parseDat(noNameFixture)

  t.is(result.ok, false)
  if (!result.ok) {
    t.is(result.error.message, 'Missing required header name')
  }
})
