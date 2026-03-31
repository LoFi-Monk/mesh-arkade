import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { getAppRootPath, initAppRoot, saveDatCache } from '../src/arkive/app-root.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-approot-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('initAppRoot creates config.json and DATs/ on first run', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const configPath = path.join(tmpPath, 'config.json')
  const datsDir = path.join(tmpPath, 'DATs')

  await initAppRoot(tmpPath)

  t.ok(fs.existsSync(configPath), 'config.json created')
  t.ok(fs.existsSync(datsDir), 'DATs/ directory created')

  const configContent = fs.readFileSync(configPath, 'utf-8')
  const config = JSON.parse(configContent)
  t.is(config.version, '1.0.0', 'config has version')
  t.ok(Array.isArray(config.collections), 'config has collections array')
  t.is(config.collections.length, 0, 'collections is empty')
})

test('initAppRoot is idempotent', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const configPath = path.join(tmpPath, 'config.json')

  await initAppRoot(tmpPath)
  const originalContent = fs.readFileSync(configPath, 'utf-8')

  // Call again - should not throw
  await initAppRoot(tmpPath)

  const newContent = fs.readFileSync(configPath, 'utf-8')
  t.is(originalContent, newContent, 'config.json not overwritten on re-run')
})

test('getAppRootPath returns a string ending in mesh-arkade', (t) => {
  const appRoot = getAppRootPath()
  t.is(typeof appRoot, 'string', 'returns a string')
  t.ok(appRoot.endsWith('mesh-arkade'), 'ends with mesh-arkade')
})

test('getAppRootPath returns custom path when provided', (t) => {
  const customPath = '/custom/path'
  const appRoot = getAppRootPath(customPath)
  t.is(appRoot, customPath, 'returns custom path')
})

test('saveDatCache writes file to DATs/<systemName>.dat', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const datsDir = path.join(tmpPath, 'DATs')
  fs.mkdirSync(datsDir, { recursive: true })

  const content = 'Mock DAT file content'
  const systemName = 'Nintendo - NES'

  await saveDatCache(systemName, content, tmpPath)

  const expectedFile = path.join(datsDir, 'Nintendo - NES.dat')
  t.ok(fs.existsSync(expectedFile), 'DAT file created')

  const writtenContent = fs.readFileSync(expectedFile, 'utf-8')
  t.is(writtenContent, content, 'content matches')
})

test('saveDatCache handles special characters in system name', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const datsDir = path.join(tmpPath, 'DATs')
  fs.mkdirSync(datsDir, { recursive: true })

  const content = 'DAT content'
  const systemName = 'Sega - Mega Drive/Genesis!'

  await saveDatCache(systemName, content, tmpPath)

  const files = fs.readdirSync(datsDir)
  t.is(files.length, 1, 'one file created')
})

test('initAppRoot creates directory structure in correct location', async (t) => {
  const tmpPath = createTmpPath()
  fs.mkdirSync(tmpPath, { recursive: true })
  t.teardown(() => {
    try {
      fs.rmSync(tmpPath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  const configPath = path.join(tmpPath, 'config.json')
  const datsDir = path.join(tmpPath, 'DATs')

  await initAppRoot(tmpPath)

  t.ok(fs.existsSync(tmpPath), 'app root directory exists')
  t.ok(fs.existsSync(configPath), 'config.json exists')
  t.ok(fs.existsSync(datsDir), 'DATs directory exists')
})
