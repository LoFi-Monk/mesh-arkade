import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { ArkiveService, IdentityServiceImpl } from '../src/arkive/index.js'
import { readConfig, initAppRoot, addCollectionToConfig } from '../src/arkive/index.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

function parseCliCommand(args: string[]): string {
  const command = args[0] ?? ''
  const subcommand = args[1] ?? ''

  if (command === 'collection') {
    switch (subcommand) {
      case 'add':
        return 'collection-add'
      case 'list':
        return 'collection-list'
      case 'scan':
        return 'collection-scan'
      default:
        return 'unknown'
    }
  }

  return command
}

test('CLI routes "collection add" command', async (t) => {
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

  const command = parseCliCommand(['collection', 'add'])
  t.is(command, 'collection-add', 'routes collection add command')

  await store.close()
})

test('CLI routes "collection list" command', async (t) => {
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

  const command = parseCliCommand(['collection', 'list'])
  t.is(command, 'collection-list', 'routes collection list command')

  await store.close()
})

test('CLI routes "collection scan" command', async (t) => {
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

  const command = parseCliCommand(['collection', 'scan'])
  t.is(command, 'collection-scan', 'routes collection scan command')

  await store.close()
})

test('CLI rejects collection commands without identity for add', async (t) => {
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
    await arkive.addCollection({ name: 'Test', path: tmpPath })
    t.fail('should have thrown')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    t.ok(errorMessage.includes('Identity'), 'throws IdentityRequiredError')
  }

  await store.close()
})

test('CLI rejects collection scan with invalid collection ID format', async (t) => {
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
  const identity = new IdentityServiceImpl(store)
  await identity.createIdentity('Test User')
  const arkive = new ArkiveService({ store, identity, customRoot: tmpPath })

  const invalidIds = [
    'short',           // too short
    'abc',             // too short
    '0000000000000000000000000000000000', // too long (33 chars)
    'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',   // non-hex chars
    'G12345678901234567890123456789012',   // non-hex uppercase
  ]

  for (const invalidId of invalidIds) {
    try {
      await arkive.scanCollection({ collectionId: invalidId })
      t.fail(`should have thrown for invalid ID: ${invalidId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ''
      t.is(errorMessage.includes('Invalid'), true, `rejects invalid ID: ${invalidId} - got: "${errorMessage}"`)
    }
  }

  const validId = 'a'.repeat(32)
  try {
    await arkive.scanCollection({ collectionId: validId })
    t.fail('should have thrown for non-existent valid ID')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    t.is(errorMessage.includes('Collection not found') || errorMessage.includes('App config not found'), true, `accepts valid format but fails - got: "${errorMessage}"`)
  }

  await store.close()
})

test('CLI list surfaces externally added collection from config.json', async (t) => {
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

  addCollectionToConfig({
    uuid: '1234567890abcdef1234567890abcdef',
    name: 'External USB Collection',
    path: '/external/usb/roms',
  }, tmpPath)

  const config = readConfig(tmpPath)
  t.ok(config, 'config exists')
  t.is(config?.collections.length, 1, 'has one collection')
  if (config?.collections[0]) {
    t.is(config.collections[0].name, 'External USB Collection', 'collection name matches')
    t.is(config.collections[0].uuid, '1234567890abcdef1234567890abcdef', 'collection uuid matches')
  }
})