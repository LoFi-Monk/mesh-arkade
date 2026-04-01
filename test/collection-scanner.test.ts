import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { walkDirectory, hashAndMatch, writeManifest } from '../src/core/collection-scanner.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('walkDirectory yields file paths non-blocking', async (t) => {
  const testDir = createTmpPath()
  fs.mkdirSync(testDir, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  fs.writeFileSync(path.join(testDir, 'file1.nes'), 'contents1')
  fs.writeFileSync(path.join(testDir, 'file2.nes'), 'contents2')
  fs.mkdirSync(path.join(testDir, 'subdir'))
  fs.writeFileSync(path.join(testDir, 'subdir', 'file3.nes'), 'contents3')

  const files: string[] = []
  for await (const file of walkDirectory(testDir)) {
    files.push(file)
  }

  t.is(files.length, 3, 'finds 3 files')
  t.ok(files.some(f => f.endsWith('file1.nes')), 'includes file1')
  t.ok(files.some(f => f.endsWith('file2.nes')), 'includes file2')
  t.ok(files.some(f => f.endsWith('file3.nes')), 'includes file3 in subdir')
})

test('hashAndMatch computes hash and checks catalog', async (t) => {
  const testDir = createTmpPath()
  fs.mkdirSync(testDir, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const testFile = path.join(testDir, 'game.nes')
  fs.writeFileSync(testFile, 'test-rom-data')

  const mockCatalog = new Map<string, boolean>()
  mockCatalog.set('E5D17C43B8F1A3F2D8E9C7B4A5F6D8E1', true)

  const result = await hashAndMatch(testFile, mockCatalog)

  t.ok(result, 'hashAndMatch succeeds')
  if (result) {
    t.ok(result.crc32, 'has CRC32')
    t.ok(result.sha1, 'has SHA1')
  }
})

test('writeManifest writes manifest.json atomically', async (t) => {
  const testDir = createTmpPath()
  fs.mkdirSync(testDir, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const manifestData = {
    collectionId: 'test-uuid',
    scannedAt: Date.now(),
    files: [
      { path: 'game1.nes', crc32: 'AABBCCDD', sha1: 'ABC123', verified: true },
      { path: 'game2.nes', crc32: '11223344', sha1: 'DEF456', verified: false },
    ],
  }

  const result = await writeManifest(testDir, manifestData)

  t.ok(result, 'writeManifest succeeds')

  const manifestPath = path.join(testDir, '.mesh-arkade', 'manifest.json')
  t.ok(fs.existsSync(manifestPath), 'manifest.json created')

  const loaded = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  t.is(loaded.collectionId, 'test-uuid', 'manifest contains collectionId')
  t.is(loaded.files.length, 2, 'manifest contains files')
})