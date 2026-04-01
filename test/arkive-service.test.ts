import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { storeDat } from '../src/store/dat-store.js'
import { ArkiveService, IdentityRequiredError, initAppRoot, readConfig, IdentityServiceImpl } from '../src/arkive/index.js'
import type { DatFile } from '../src/dat/types.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('listTitles returns all stored titles after catalog refresh', async (t) => {
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
    header: { name: 'Nintendo - NES' },
    games: [
      {
        name: 'Donkey Kong',
        roms: [{ name: 'donkeykong.nes', size: 24576, crc: '6B0C2D41' }],
      },
      {
        name: 'Metroid',
        roms: [{ name: 'metroid.nes', size: 262144, crc: '45534F58' }],
      },
      {
        name: 'Super Mario Bros.',
        roms: [{ name: 'smb.nes', size: 40960, crc: 'AABBCCDD' }],
      },
    ],
  }

  await storeDat(store, 'nes', datFile)

  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })
  const titles = await arkive.listTitles({ system: 'nes' })

  t.is(titles.length, 3, 'returns 3 titles')
  t.ok(titles.some((t) => t.name === 'donkey kong'), 'includes Donkey Kong')
  t.ok(titles.some((t) => t.name === 'metroid'), 'includes Metroid')
  t.ok(titles.some((t) => t.name === 'super mario bros.'), 'includes Super Mario Bros')

  await store.close()
})

test('listTitles returns empty array on empty store', async (t) => {
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
  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const titles = await arkive.listTitles({ system: 'nes' })

  t.is(titles.length, 0, 'returns empty array')

  await store.close()
})

test('searchByName returns matching titles (case-insensitive)', async (t) => {
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
    header: { name: 'Nintendo - NES' },
    games: [
      {
        name: 'Super Mario Bros.',
        roms: [{ name: 'smb.nes', size: 40960, crc: 'AABBCCDD' }],
      },
      {
        name: 'Super Mario Bros. 2',
        roms: [{ name: 'smb2.nes', size: 40960, crc: 'AABBCCDE' }],
      },
      {
        name: 'Donkey Kong',
        roms: [{ name: 'donkeykong.nes', size: 24576, crc: '6B0C2D41' }],
      },
    ],
  }

  await storeDat(store, 'nes', datFile)

  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const results1 = await arkive.searchByName({ system: 'nes', query: 'super mario' })
  t.is(results1.length, 2, 'finds 2 results for "super mario"')

  const results2 = await arkive.searchByName({ system: 'nes', query: 'SUPER MARIO' })
  t.is(results2.length, 2, 'case-insensitive search works')

  const results3 = await arkive.searchByName({ system: 'nes', query: 'super' })
  t.is(results3.length, 2, 'prefix match works')

  await store.close()
})

test('searchByName returns empty array on no match', async (t) => {
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
    header: { name: 'Nintendo - NES' },
    games: [
      {
        name: 'Donkey Kong',
        roms: [{ name: 'donkeykong.nes', size: 24576, crc: '6B0C2D41' }],
      },
    ],
  }

  await storeDat(store, 'nes', datFile)

  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const results = await arkive.searchByName({ system: 'nes', query: 'zzz' })
  t.is(results.length, 0, 'returns empty array for no match')

  await store.close()
})

test('getTitle returns full enriched entry for known CRC', async (t) => {
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
    header: { name: 'Nintendo - NES' },
    games: [
      {
        name: 'Donkey Kong (USA)',
        roms: [
          {
            name: 'donkeykong.nes',
            size: 24576,
            crc: '6B0C2D41',
            developer: 'Nintendo',
            genre: 'Platformer',
            releaseyear: '1985',
            publisher: 'Nintendo',
            region: 'USA',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'nes', datFile)

  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const entry = await arkive.getTitle('nes', '6B0C2D41')

  t.ok(entry, 'returns entry for known CRC')
  if (entry) {
    t.is(entry.gameName, 'Donkey Kong (USA)', 'gameName matches')
    t.is(entry.romName, 'donkeykong.nes', 'romName matches')
    t.is(entry.size, 24576, 'size matches')
    t.is(entry.crc, '6B0C2D41', 'CRC matches')
    t.is(entry.developer, 'Nintendo', 'developer enriched')
    t.is(entry.genre, 'Platformer', 'genre enriched')
    t.is(entry.releaseyear, '1985', 'releaseyear enriched')
    t.is(entry.publisher, 'Nintendo', 'publisher enriched')
    t.is(entry.region, 'USA', 'region enriched')
  }

  await store.close()
})

test('getTitle returns null for unknown CRC', async (t) => {
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
  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const entry = await arkive.getTitle('nes', 'FFFFFFFF')

  t.is(entry, null, 'returns null for unknown CRC')

  await store.close()
})

test('createCollection throws IdentityRequiredError when no identity provided', async (t) => {
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
  const arkive = new ArkiveService({ store })

  try {
    await arkive.createCollection('My Collection')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('addToCollection throws IdentityRequiredError when no identity provided', async (t) => {
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
  const arkive = new ArkiveService({ store })

  try {
    await arkive.addToCollection('collection-id', '6B0C2D41')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('listTitles respects limit and offset', async (t) => {
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
    header: { name: 'Nintendo - NES' },
    games: [
      { name: 'Game A', roms: [{ name: 'a.nes', size: 1024, crc: 'AAAAAAAA' }] },
      { name: 'Game B', roms: [{ name: 'b.nes', size: 1024, crc: 'BBBBBBBB' }] },
      { name: 'Game C', roms: [{ name: 'c.nes', size: 1024, crc: 'CCCCCCCC' }] },
      { name: 'Game D', roms: [{ name: 'd.nes', size: 1024, crc: 'DDDDDDDD' }] },
      { name: 'Game E', roms: [{ name: 'e.nes', size: 1024, crc: 'EEEEEEEE' }] },
    ],
  }

  await storeDat(store, 'nes', datFile)

  const arkive = new ArkiveService({ store, identity: new IdentityServiceImpl(store) })

  const firstTwo = await arkive.listTitles({ system: 'nes', limit: 2 })
  t.is(firstTwo.length, 2, 'limit returns correct count')

  const skipFirstTwo = await arkive.listTitles({ system: 'nes', offset: 2, limit: 2 })
  t.is(skipFirstTwo.length, 2, 'offset skips correctly')

  await store.close()
})

test('addCollection updates App Root config.json', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  await initAppRoot(tmpPath)

  const store = createStore(tmpPath)
  const identityService = new IdentityServiceImpl(store)
  await identityService.createIdentity('TestUser')

  const arkive = new ArkiveService({ store, identity: identityService, customRoot: tmpPath })

  const collectionPath = path.join(tmpPath, 'my-collection')
  fs.mkdirSync(collectionPath, { recursive: true })

  const result = await arkive.addCollection({ name: 'My Collection', path: collectionPath })

  t.ok(result.id, 'collection has UUID')
  t.is(result.name, 'My Collection', 'collection name matches')

  const config = readConfig(tmpPath)
  t.ok(config, 'config exists')
  const firstCollection = config?.collections?.[0]
  if (firstCollection) {
    t.is(firstCollection.name, 'My Collection', 'config has collection name')
    t.is(firstCollection.path, collectionPath, 'config has collection path')
  }

  await store.close()
})

test('scanCollection generates manifest.json', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  await initAppRoot(tmpPath)

  const store = createStore(tmpPath)
  const identityService = new IdentityServiceImpl(store)
  await identityService.createIdentity('TestUser')

  const arkive = new ArkiveService({ store, identity: identityService, customRoot: tmpPath })

  const collectionPath = path.join(tmpPath, 'my-collection')
  fs.mkdirSync(collectionPath, { recursive: true })

  fs.writeFileSync(path.join(collectionPath, 'game1.nes'), 'rom-data-1')
  fs.writeFileSync(path.join(collectionPath, 'game2.nes'), 'rom-data-2')

  const collectionResult = await arkive.addCollection({ name: 'Test Collection', path: collectionPath })

  const manifest = await arkive.scanCollection({ collectionId: collectionResult.id })

  t.ok(manifest, 'scanCollection returns manifest')
  t.ok((manifest as { files: unknown[] }).files.length >= 2, 'manifest has at least 2 files')

  const markerPath = path.join(collectionPath, '.mesh-arkade', 'manifest.json')
  t.ok(fs.existsSync(markerPath), 'manifest.json exists in collection')

  const loadedManifest = JSON.parse(fs.readFileSync(markerPath, 'utf-8'))
  t.is(loadedManifest.collectionId, collectionResult.id, 'manifest has correct collectionId')
  t.ok(loadedManifest.files.length >= 2, 'manifest file has at least 2 entries')

  await store.close()
})

test('addCollection throws IdentityRequiredError when no identity', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  await initAppRoot(tmpPath)

  const store = createStore(tmpPath)
  const arkive = new ArkiveService({ store })

  const collectionPath = path.join(tmpPath, 'my-collection')
  fs.mkdirSync(collectionPath, { recursive: true })

  try {
    await arkive.addCollection({ name: 'Test', path: collectionPath })
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('scanCollection throws IdentityRequiredError when no identity', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  await initAppRoot(tmpPath)

  const store = createStore(tmpPath)
  const arkive = new ArkiveService({ store })

  try {
    await arkive.scanCollection({ collectionId: 'test-id' })
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})
