import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { registerCollection, listCollections } from '../src/core/collection-registry.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('registerCollection generates UUID, creates .mesh-arkade/ folder, and saves collection.json', async (t) => {
  const collectionPath = createTmpPath()
  fs.mkdirSync(collectionPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(collectionPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result = await registerCollection(collectionPath, 'My NES Collection')

  t.ok(result.ok, 'registerCollection succeeds')
  if (result.ok) {
    const markerPath = path.join(collectionPath, '.mesh-arkade')
    t.ok(fs.existsSync(markerPath), '.mesh-arkade folder created')

    const collectionJsonPath = path.join(markerPath, 'collection.json')
    t.ok(fs.existsSync(collectionJsonPath), 'collection.json created')

    const collectionData = JSON.parse(fs.readFileSync(collectionJsonPath, 'utf-8'))
    t.ok(collectionData.id, 'collection has UUID id')
    t.is(collectionData.name, 'My NES Collection', 'collection name matches')
    t.ok(collectionData.createdAt, 'collection has createdAt timestamp')
  }
})

test('registerCollection returns error for non-existent path', async (t) => {
  const nonExistentPath = path.join(createTmpPath(), 'does-not-exist')

  const result = await registerCollection(nonExistentPath, 'Test')

  t.ok(!result.ok, 'registerCollection fails for non-existent path')
  if (!result.ok) {
    t.is(result.error.type, 'path-not-found', 'error type is path-not-found')
  }
})

test('listCollections discovers registered collections', async (t) => {
  const rootPath = createTmpPath()
  fs.mkdirSync(rootPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(rootPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const collection1Path = path.join(rootPath, 'nes-collection')
  const collection2Path = path.join(rootPath, 'snes-collection')

  fs.mkdirSync(collection1Path, { recursive: true })
  fs.mkdirSync(collection2Path, { recursive: true })

  await registerCollection(collection1Path, 'NES Collection')
  await registerCollection(collection2Path, 'SNES Collection')

  const collections = await listCollections(rootPath)

  t.is(collections.length, 2, 'discovers 2 collections')
  const names = collections.map(c => c.name).sort()
  t.is(names[0], 'NES Collection', 'includes first collection')
  t.is(names[1], 'SNES Collection', 'includes second collection')
})

test('listCollections marks connected/disconnected based on folder presence', async (t) => {
  const rootPath = createTmpPath()
  fs.mkdirSync(rootPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(rootPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const collectionPath = path.join(rootPath, 'my-collection')
  fs.mkdirSync(collectionPath, { recursive: true })

  await registerCollection(collectionPath, 'My Collection')

  const collections = await listCollections(rootPath)

  t.is(collections.length, 1, 'finds 1 collection')
  const firstCollection = collections[0]
  t.ok(firstCollection && firstCollection.connected, 'collection is marked as connected')
})