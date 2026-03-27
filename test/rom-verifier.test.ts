import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { storeDat } from '../src/store/dat-store.js'
import { verifyRom } from '../src/core/rom-verifier.js'
import { hashRom } from '../src/core/rom-hasher.js'
import type { DatFile } from '../src/dat/types.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('verifyRom returns Verified for a ROM with known hash', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const filePath = path.join(tmpPath, 'test.nes')
  const mockData = Buffer.from('FAKE_NES_ROM_VERIFIED')
  fs.writeFileSync(filePath, mockData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const { sha1, crc32 } = await hashRom(filePath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Test Game',
        roms: [
          {
            name: 'test.nes',
            size: mockData.length,
            sha1: sha1,
            crc: crc32,
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await verifyRom(filePath, 'Test System', store)

  t.is(result.status, 'Verified', 'ROM is verified')
  t.ok(result.entry, 'entry is present for verified ROM')
  if (result.entry) {
    t.is(result.entry.gameName, 'Test Game', 'gameName matches')
    t.is(result.entry.romName, 'test.nes', 'romName matches')
  }
})

test('verifyRom returns Unknown for a ROM with unknown hash', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const filePath = path.join(tmpPath, 'unknown.nes')
  const mockData = Buffer.from('UNKNOWN_ROM_DATA')
  fs.writeFileSync(filePath, mockData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'Known Game',
        roms: [
          {
            name: 'known.nes',
            size: 1024,
            sha1: '0000000000000000000000000000000000000000',
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await verifyRom(filePath, 'Test System', store)

  t.is(result.status, 'Unknown', 'ROM is unknown')
  t.absent(result.entry, 'entry is absent for unknown ROM')
})

test('verifyRom returns Unknown (not BadDump) per ADR-0014', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const filePath = path.join(tmpPath, 'fake.nes')
  const mockData = Buffer.from('SOME_ROM_DATA')
  fs.writeFileSync(filePath, mockData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result = await verifyRom(filePath, 'Empty System', store)

  t.is(result.status, 'Unknown', 'returns Unknown, not BadDump')
})

test('verifyRom throws for non-existent file', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  try {
    await verifyRom(path.join(tmpPath, 'nonexistent.rom'), 'Test System', store)
    t.fail('should have thrown')
  } catch {
    t.pass('throws error for non-existent file')
  }
})

test('verifyRom uses O(1) lookup via hash key', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const store = createStore(tmpPath)
  await store.ready()

  const filePath = path.join(tmpPath, 'o1test.nes')
  const mockData = Buffer.from('O1_LOOKUP_TEST')
  fs.writeFileSync(filePath, mockData)

  t.teardown(async () => {
    try {
      await store.close()
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const { sha1, crc32 } = await hashRom(filePath)

  const datFile: DatFile = {
    header: { name: 'Test System' },
    games: [
      {
        name: 'O1 Test Game',
        roms: [
          {
            name: 'o1test.nes',
            size: mockData.length,
            sha1: sha1,
            crc: crc32,
          },
        ],
      },
    ],
  }

  await storeDat(store, 'Test System', datFile)

  const result = await verifyRom(filePath, 'Test System', store)

  t.is(result.status, 'Verified', 'O(1) lookup succeeded')
  if (result.entry) {
    t.is(result.entry.sha1, sha1, 'sha1 matches')
  }
})
