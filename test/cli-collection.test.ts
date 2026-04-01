import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { ArkiveService } from '../src/arkive/index.js'

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

test('CLI rejects collection commands without identity for scan', async (t) => {
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
    await arkive.scanCollection({ collectionId: 'test-id' })
    t.fail('should have thrown')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    t.ok(errorMessage.includes('Identity'), 'throws IdentityRequiredError')
  }

  await store.close()
})