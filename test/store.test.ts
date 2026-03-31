import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { storeDat } from '../src/store/dat-store.js'
import { lookupRom, lookupByType } from '../src/store/dat-lookup.js'
import { addManagedSystem, listManagedSystems } from '../src/store/systems.js'
import type { DatFile } from '../src/dat/types.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('createStore returns a store object', (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  t.ok(store.db, 'db is present')
  t.ok(store.store, 'store is present')
  t.is(typeof store.ready, 'function', 'ready is a function')
  t.is(typeof store.close, 'function', 'close is a function')
})

test('store ready() initializes the store', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)
  await store.ready()

  t.pass('store is ready')
})

test('store close() releases resources', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)
  await store.ready()
  await store.close()

  t.pass('store closed without error')
})

test('closed store rejects operations', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)
  await store.ready()
  await store.close()

  try {
    await store.db.put('test', { value: 'test' })
    t.fail('should have thrown')
  } catch {
    t.pass('closed store rejects operations')
  }
})

test('storeDat writes ROM entries with all hash types', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            crc: 'ABCD1234',
            md5: 'aabbccdd11223344556677889900aabb',
            sha1: '11223344556677889900aabbccdd112233445566',
          },
        ],
      },
    ],
  }

  const result = await storeDat(store, 'Test System', datFile)

  t.is(result.ok, true, 'storeDat returns ok')
  t.is(result.romCount, 1, 'romCount is 1')

  const sha1Lookup = await lookupRom(store, 'Test System', '11223344556677889900aabbccdd112233445566')
  t.ok(sha1Lookup, 'lookup by SHA1 succeeds')
  if (sha1Lookup) {
    t.is(sha1Lookup.matchedBy, 'sha1', 'matchedBy is sha1')
    t.is(sha1Lookup.entry.gameName, 'Test Game', 'gameName matches')
    t.is(sha1Lookup.entry.romName, 'test.rom', 'romName matches')
  }

  const md5Lookup = await lookupRom(store, 'Test System', 'aabbccdd11223344556677889900aabb')
  t.ok(md5Lookup, 'lookup by MD5 succeeds')
  if (md5Lookup) {
    t.is(md5Lookup.matchedBy, 'md5', 'matchedBy is md5')
  }

  const crcLookup = await lookupRom(store, 'Test System', 'ABCD1234')
  t.ok(crcLookup, 'lookup by CRC succeeds')
  if (crcLookup) {
    t.is(crcLookup.matchedBy, 'crc', 'matchedBy is crc')
  }

  await store.close()
})

test('storeDat writes SHA256 when present', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            sha256: '11223344556677889900aabbccdd11223344556677889900aabbccdd1122334455',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const sha256Lookup = await lookupRom(store, 'Test System', '11223344556677889900aabbccdd11223344556677889900aabbccdd1122334455')
  t.ok(sha256Lookup, 'lookup by SHA256 succeeds')
  if (sha256Lookup) {
    t.is(sha256Lookup.matchedBy, 'sha256', 'matchedBy is sha256')
  }

  await store.close()
})

test('storeDat normalizes hashes to uppercase', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            sha1: 'abcd1234efgh5678ijkl9012mnop3456qrst7890',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const lookupLower = await lookupRom(store, 'Test System', 'abcd1234efgh5678ijkl9012mnop3456qrst7890')
  t.ok(lookupLower, 'lookup with lowercase hash succeeds')

  const lookupUpper = await lookupRom(store, 'Test System', 'ABCD1234EFGH5678IJKL9012MNOP3456QRST7890')
  t.ok(lookupUpper, 'lookup with uppercase hash succeeds')

  await store.close()
})

test('lookupRom returns null for unknown hash', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const result = await lookupRom(store, 'Test System', '0000000000000000000000000000000000000000')

  t.is(result, null, 'returns null for unknown hash')

  await store.close()
})

test('lookupRom falls back from SHA1 to MD5', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            md5: 'aabbccdd11223344556677889900aabb',
            sha1: '0000000000000000000000000000000000000000',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupRom(store, 'Test System', 'aabbccdd11223344556677889900aabb')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.matchedBy, 'md5', 'falls back to MD5')
  }

  await store.close()
})

test('storeDat preserves serial in stored values', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            crc: 'ABCD1234',
            serial: 'GM-0001',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupRom(store, 'Test System', 'ABCD1234')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.entry.serial, 'GM-0001', 'serial is preserved')
  }

  await store.close()
})

test('addManagedSystem and listManagedSystems work', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  await addManagedSystem(store, 'Nintendo - NES')
  await addManagedSystem(store, 'Sega - Genesis')

  const systems = await listManagedSystems(store)

  t.is(systems.length, 2, 'two systems registered')
  t.ok(systems.includes('Nintendo - NES'), 'NES is registered')
  t.ok(systems.includes('Sega - Genesis'), 'Genesis is registered')

  await store.close()
})

test('addManagedSystem is idempotent', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  await addManagedSystem(store, 'Nintendo - NES')
  await addManagedSystem(store, 'Nintendo - NES')
  await addManagedSystem(store, 'Nintendo - NES')

  const systems = await listManagedSystems(store)

  t.is(systems.length, 1, 'only one system registered')
  t.is(systems[0], 'Nintendo - NES', 'correct system name')

  await store.close()
})

test('prefix scan returns all entries for a system', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Game 1',
        roms: [
          { name: 'rom1.nes', size: 1024, crc: 'AAAA1111' },
          { name: 'rom2.nes', size: 2048, crc: 'BBBB2222' },
        ],
      },
      {
        name: 'Game 2',
        roms: [
          { name: 'rom3.nes', size: 4096, crc: 'CCCC3333' },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)
  await store.ready()

  const db = store.db.sub('dat').sub('Test System')
  const entries: string[] = []

  for await (const entry of db.createReadStream()) {
    entries.push(entry.key)
  }

  t.is(entries.length, 6, '6 entries (3 CRC + 2 name + 1 header)')
  t.ok(entries.includes('header'), 'header key present')
  t.ok(entries.includes('crc:AAAA1111'), 'CRC1 key present')
  t.ok(entries.includes('crc:BBBB2222'), 'CRC2 key present')
  t.ok(entries.includes('crc:CCCC3333'), 'CRC3 key present')

  await store.close()
})

test('prefix scan returns empty for unknown system', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)
  await store.ready()

  const db = store.db.sub('dat').sub('Unknown System')
  const entries: string[] = []

  for await (const entry of db.createReadStream()) {
    entries.push(entry.key)
  }

  t.is(entries.length, 0, 'no entries for unknown system')

  await store.close()
})

test('CRC-only ROM stored values have md5 and sha1 as null', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            crc: 'ABCD1234',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupRom(store, 'Test System', 'ABCD1234')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.entry.md5, null, 'md5 is null for CRC-only ROM')
    t.is(result.entry.sha1, null, 'sha1 is null for CRC-only ROM')
    t.is(result.entry.sha256, null, 'sha256 is null for CRC-only ROM')
    t.is(result.entry.crc, 'ABCD1234', 'crc is present')
  }

  await store.close()
})

test('header value stores name and version', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Nintendo - NES', version: '20240101' },
    games: [],
  }

  await storeDat(store, 'Nintendo - NES', datFile)
  await store.ready()

  const db = store.db.sub('dat').sub('Nintendo - NES')
  const headerEntry = await db.get('header')

  t.ok(headerEntry, 'header entry exists')
  if (headerEntry) {
    const header = headerEntry.value as { name: string; version: string | null }
    t.is(header.name, 'Nintendo - NES', 'header name matches')
    t.is(header.version, '20240101', 'header version matches')
  }

  await store.close()
})

test('lookupRom falls back to CRC after SHA1 and MD5 miss', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            crc: 'DEADBEEF',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupRom(store, 'Test System', 'DEADBEEF')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.matchedBy, 'crc', 'falls back to CRC')
  }

  await store.close()
})

test('lookupByType finds entry by SHA1 type', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            sha1: 'AABBCCDDEEFF00112233445566778899AABBCCDD',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupByType(store, 'Test System', 'sha1', 'AABBCCDDEEFF00112233445566778899AABBCCDD')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.matchedBy, 'sha1', 'matched by sha1')
    t.is(result.entry.gameName, 'Test Game', 'gameName matches')
  }

  await store.close()
})

test('lookupByType finds entry by CRC type', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            crc: 'CAFEBABE',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupByType(store, 'Test System', 'crc', 'CAFEBABE')

  t.ok(result, 'lookup succeeds')
  if (result) {
    t.is(result.matchedBy, 'crc', 'matched by crc')
    t.is(result.entry.gameName, 'Test Game', 'gameName matches')
  }

  await store.close()
})

test('lookupByType returns null when hash type does not match', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            sha1: 'AABBCCDDEEFF00112233445566778899AABBCCDD',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await lookupByType(store, 'Test System', 'crc', 'AABBCCDDEEFF00112233445566778899AABBCCDD')

  t.is(result, null, 'returns null when looking up sha1 hash as crc')

  await store.close()
})

test('lookupByType returns null for unknown hash', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const result = await lookupByType(store, 'Test System', 'sha1', '0000000000000000000000000000000000000000')

  t.is(result, null, 'returns null for unknown hash')

  await store.close()
})

test('lookupByType is case-insensitive', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.rom',
            size: 1024,
            sha1: 'AABBCCDDEEFF00112233445566778899AABBCCDD',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const upperResult = await lookupByType(store, 'Test System', 'sha1', 'AABBCCDDEEFF00112233445566778899AABBCCDD')
  const lowerResult = await lookupByType(store, 'Test System', 'sha1', 'aabbccddeeff00112233445566778899aabbccdd')

  t.ok(upperResult, 'uppercase lookup succeeds')
  t.ok(lowerResult, 'lowercase lookup succeeds')

  await store.close()
})

test('storeDat creates name index entries', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Donkey Kong',
        roms: [
          { name: 'donkeykong.nes', size: 24576, crc: '6B0C2D41' },
        ],
      },
      {
        name: 'Metroid',
        roms: [
          { name: 'metroid.nes', size: 262144, crc: '45534F58' },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)
  await store.ready()

  const nameIndex = store.db.sub('dat').sub('Test System').sub('name')
  const entries: string[] = []

  for await (const entry of nameIndex.createReadStream()) {
    entries.push(entry.key)
  }

  t.is(entries.length, 2, '2 name index entries created')
  t.ok(entries.includes('donkey kong'), 'normalized name "donkey kong" indexed')
  t.ok(entries.includes('metroid'), 'normalized name "metroid" indexed')

  await store.close()
})

test('name index supports prefix scan', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Donkey Kong',
        roms: [
          { name: 'donkeykong.nes', size: 24576, crc: '6B0C2D41' },
        ],
      },
      {
        name: 'Donkey Kong Junior',
        roms: [
          { name: 'donkeykongjr.nes', size: 24576, crc: 'F5A52E62' },
        ],
      },
      {
        name: 'Donkey Kong 3',
        roms: [
          { name: 'donkeykong3.nes', size: 24576, crc: 'AABBCCDD' },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)
  await store.ready()

  const nameIndex = store.db.sub('dat').sub('Test System').sub('name')

  const entriesStartingWithDonkey: string[] = []
  for await (const entry of nameIndex.createReadStream({ gte: 'donkey', lt: 'donkey\xff' })) {
    entriesStartingWithDonkey.push(entry.key)
  }

  t.is(entriesStartingWithDonkey.length, 3, 'all 3 Donkey Kong games found via prefix scan')

  await store.close()
})

test('name index rebuilds on re-store', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile1: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Game A',
        roms: [
          { name: 'gamea.nes', size: 1024, crc: 'AAAA1111' },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile1)

  const datFile2: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Game B',
        roms: [
          { name: 'gameb.nes', size: 2048, crc: 'BBBB2222' },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile2)
  await store.ready()

  const nameIndex = store.db.sub('dat').sub('Test System').sub('name')
  const entries: string[] = []

  for await (const entry of nameIndex.createReadStream()) {
    entries.push(entry.key)
  }

  t.is(entries.length, 1, 'only 1 name entry after re-store')
  t.ok(entries.includes('game b'), 'new game indexed')
  t.ok(!entries.includes('game a'), 'old game removed')

  await store.close()
})

test('ROM without CRC does not create name index entry', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const store = createStore(tmpPath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Game With CRC',
        roms: [
          { name: 'game1.nes', size: 1024, crc: 'AAAA1111' },
        ],
      },
      {
        name: 'Game Without CRC',
        roms: [
          { name: 'game2.nes', size: 2048 },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)
  await store.ready()

  const nameIndex = store.db.sub('dat').sub('Test System').sub('name')
  const entries: string[] = []

  for await (const entry of nameIndex.createReadStream()) {
    entries.push(entry.key)
  }

  t.is(entries.length, 1, 'only 1 name entry for ROM with CRC')
  t.ok(entries.includes('game with crc'), 'game with CRC indexed')

  await store.close()
})
