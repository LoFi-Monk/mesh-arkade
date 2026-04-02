import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { getFetch, getFs, pathExists } from '../src/core/runtime.js'

test('getFetch returns a function', (t) => {
  const fetchFn = getFetch()
  t.is(typeof fetchFn, 'function', 'getFetch returns the global fetch function')
})

test('getFs returns an object with readFile and writeFile', (t) => {
  const fsMod = getFs()
  t.is(typeof fsMod.readFile, 'function', 'getFs exposes readFile')
  t.is(typeof fsMod.writeFile, 'function', 'getFs exposes writeFile')
})

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-runtime-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('pathExists returns true for directories', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const dirPath = path.join(tmpPath, 'subdir')
  fs.mkdirSync(dirPath, { recursive: true })

  t.ok(pathExists(dirPath), 'pathExists returns true for existing directory')
})

test('pathExists returns true for files', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const filePath = path.join(tmpPath, 'test.txt')
  fs.writeFileSync(filePath, 'test content')

  t.ok(pathExists(filePath), 'pathExists returns true for existing file')
})

test('pathExists returns false for non-existent paths', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  t.is(pathExists(path.join(tmpPath, 'nonexistent')), false, 'pathExists returns false for non-existent path')
})
