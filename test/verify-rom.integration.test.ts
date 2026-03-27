import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { storeDat } from '../src/store/dat-store.js'
import { hashRom } from '../src/core/rom-hasher.js'
import { verifyRom } from '../src/core/rom-verifier.js'
import type { DatFile } from '../src/dat/types.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('end-to-end: create mock ROM, seed DAT store, verify ROM', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const mockRomPath = path.join(tmpPath, 'mock-game.nes')
  const mockData = Buffer.from('INTEGRATION_TEST_ROM_DATA_123')
  fs.writeFileSync(mockRomPath, mockData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const { sha1, crc32 } = await hashRom(mockRomPath)

  const datFile: DatFile = {
    header: { name: 'Integration Test System' },
    games: [
      {
        name: 'Mock Game',
        roms: [
          {
            name: 'mock-game.nes',
            size: mockData.length,
            sha1: sha1,
            crc: crc32,
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Integration Test System', datFile)

  const result = await verifyRom(mockRomPath, 'Integration Test System', store)

  t.is(result.status, 'Verified', 'ROM verified end-to-end')
  t.ok(result.entry, 'entry returned')
  if (result.entry) {
    t.is(result.entry.gameName, 'Mock Game', 'correct game name')
    t.is(result.entry.romName, 'mock-game.nes', 'correct rom name')
    t.is(result.entry.size, mockData.length, 'correct size')
  }
})

test('end-to-end: unknown ROM returns Unknown status', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const unknownRomPath = path.join(tmpPath, 'unknown.nes')
  const unknownData = Buffer.from('THIS_ROM_IS_NOT_IN_DAT_STORE')
  fs.writeFileSync(unknownRomPath, unknownData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const datFile: DatFile = {
    header: { name: 'Another System' },
    games: [
      {
        name: 'Some Game',
        roms: [
          {
            name: 'some-game.nes',
            size: 1024,
            sha1: '0000000000000000000000000000000000000000',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Another System', datFile)

  const result = await verifyRom(unknownRomPath, 'Another System', store)

  t.is(result.status, 'Unknown', 'unknown ROM returns Unknown status')
  t.absent(result.entry, 'no entry for unknown ROM')
})

test('end-to-end: temporary files and databases are cleaned up', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const filePath = path.join(tmpPath, 'cleanup-test.nes')
  fs.writeFileSync(filePath, Buffer.from('TEST_DATA'))

  await store.close()
  fs.rmSync(tmpPath, { recursive: true, force: true })

  t.ok(!fs.existsSync(tmpPath), 'temporary directory is removed')
  t.ok(!fs.existsSync(filePath), 'temporary file is removed')
})
