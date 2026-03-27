import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { hashRom } from '../src/core/rom-hasher.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('hashRom returns CRC32 and SHA1 hashes for a file', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const filePath = path.join(tmpPath, 'test.rom')
  const mockData = Buffer.from('FAKE_NES_ROM_DATA_12345')
  fs.writeFileSync(filePath, mockData)

  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result = await hashRom(filePath)

  t.is(typeof result.crc32, 'string', 'crc32 is a string')
  t.is(typeof result.sha1, 'string', 'sha1 is a string')
  t.is(result.crc32.length, 8, 'CRC32 is 8 hex characters')
  t.is(result.sha1.length, 40, 'SHA1 is 40 hex characters')
})

test('hashRom computes consistent hashes for the same data', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const filePath = path.join(tmpPath, 'test.rom')
  const mockData = Buffer.from('CONSISTENT_TEST_DATA')
  fs.writeFileSync(filePath, mockData)

  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result1 = await hashRom(filePath)
  const result2 = await hashRom(filePath)

  t.is(result1.crc32, result2.crc32, 'CRC32 is consistent')
  t.is(result1.sha1, result2.sha1, 'SHA1 is consistent')
})

test('hashRom produces known hash values', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const filePath = path.join(tmpPath, 'known.rom')
  const mockData = Buffer.from([0x00, 0x01, 0x02, 0x03])
  fs.writeFileSync(filePath, mockData)

  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result = await hashRom(filePath)

  t.is(result.crc32.toUpperCase(), '8BB98613', 'CRC32 matches expected value')
  t.is(result.sha1.toUpperCase(), 'A02A05B025B928C039CF1AE7E8EE04E7C190C0DB', 'SHA1 matches expected value')
})

test('hashRom throws error for non-existent file', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })

  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  try {
    await hashRom(path.join(tmpPath, 'nonexistent.rom'))
    t.fail('should have thrown')
  } catch {
    t.pass('throws error for non-existent file')
  }
})

test('hashRom handles empty file', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  const filePath = path.join(tmpPath, 'empty.rom')
  fs.writeFileSync(filePath, Buffer.alloc(0))

  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const result = await hashRom(filePath)

  t.is(typeof result.crc32, 'string', 'crc32 is a string for empty file')
  t.is(typeof result.sha1, 'string', 'sha1 is a string for empty file')
  t.is(result.crc32.length, 8, 'CRC32 is 8 hex characters')
  t.is(result.sha1.length, 40, 'SHA1 is 40 hex characters')
})
