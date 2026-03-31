import test from 'brittle'
import * as fs from 'fs'
import * as path from 'path'
import { createStore } from '../src/store/store.js'
import { IdentityService } from '../src/arkive/identity-service.js'
import { IdentityRequiredError } from '../src/arkive/types.js'

function getTmpDir(): string {
  return process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'
}

function createTmpPath(): string {
  return path.join(getTmpDir(), `mesh-arkade-identity-test-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

test('first creation returns Identity with correct fields', async (t) => {
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
  const identityService = new IdentityService(store)

  const identity = await identityService.createIdentity('TestUser')

  t.is(identity.displayName, 'TestUser', 'displayName is set')
  t.ok(identity.publicKey, 'publicKey is set')
  t.is(typeof identity.ratio, 'number', 'ratio is a number')
  t.is(typeof identity.rep, 'number', 'rep is a number')
  t.is(typeof identity.trustScore, 'number', 'trustScore is a number')
  t.ok(identity.id, 'id is set')

  await store.close()
})

test('duplicate creation throws', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')

  try {
    await identityService.createIdentity('TestUser')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof Error, 'throws an error')
    t.is((err as Error).message, 'Identity already exists', 'error message is correct')
  }

  await store.close()
})

test('getIdentity() returns Identity after creation', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')

  const identity = await identityService.getIdentity()

  t.ok(identity, 'returns identity')
  t.is(identity?.displayName, 'TestUser', 'displayName matches')

  await store.close()
})

test('getIdentity() returns null before creation', async (t) => {
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
  const identityService = new IdentityService(store)

  const identity = await identityService.getIdentity()

  t.is(identity, null, 'returns null')

  await store.close()
})

test('hasIdentity() returns true after creation', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')

  const hasIdentity = await identityService.hasIdentity()

  t.is(hasIdentity, true, 'returns true')

  await store.close()
})

test('hasIdentity() returns false before creation', async (t) => {
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
  const identityService = new IdentityService(store)

  const hasIdentity = await identityService.hasIdentity()

  t.is(hasIdentity, false, 'returns false')

  await store.close()
})

test('create profile succeeds', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  const profile = await identityService.createProfile('ChildProfile1')

  t.ok(profile.id, 'profile has id')
  t.is(profile.displayName, 'ChildProfile1', 'displayName matches')
  t.is(profile.active, false, 'new profile is not active')

  await store.close()
})

test('create profile without identity throws IdentityRequiredError', async (t) => {
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
  const identityService = new IdentityService(store)

  try {
    await identityService.createProfile('ChildProfile1')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('list profiles returns created profiles', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  await identityService.createProfile('ChildProfile1')
  await identityService.createProfile('ChildProfile2')

  const profiles = await identityService.getProfiles()

  t.is(profiles.length, 2, 'returns 2 profiles')
  t.ok(profiles.some(p => p.displayName === 'ChildProfile1'), 'includes ChildProfile1')
  t.ok(profiles.some(p => p.displayName === 'ChildProfile2'), 'includes ChildProfile2')

  await store.close()
})

test('list profiles returns empty array when none created', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')

  const profiles = await identityService.getProfiles()

  t.is(profiles.length, 0, 'returns empty array')

  await store.close()
})

test('list profiles without identity throws', async (t) => {
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
  const identityService = new IdentityService(store)

  try {
    await identityService.getProfiles()
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('get active profile returns null when none set', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  await identityService.createProfile('ChildProfile1')

  const activeProfile = await identityService.getActiveProfile()

  t.is(activeProfile, null, 'returns null when no active profile')

  await store.close()
})

test('set active profile succeeds', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  const profile1 = await identityService.createProfile('ChildProfile1')
  await identityService.createProfile('ChildProfile2')

  await identityService.setActiveProfile(profile1.id)

  const activeProfile = await identityService.getActiveProfile()

  t.ok(activeProfile, 'returns active profile')
  t.is(activeProfile?.id, profile1.id, 'active profile is the one that was set')

  await store.close()
})

test('set active deactivates previously active', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  const profile1 = await identityService.createProfile('ChildProfile1')
  const profile2 = await identityService.createProfile('ChildProfile2')

  await identityService.setActiveProfile(profile1.id)
  await identityService.setActiveProfile(profile2.id)

  const profiles = await identityService.getProfiles()
  const activeProfile = await identityService.getActiveProfile()

  t.is(profiles.filter(p => p.active).length, 1, 'only one profile is active')
  t.is(activeProfile?.id, profile2.id, 'new profile is now active')

  await store.close()
})

test('set active with invalid ID throws', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  await identityService.createProfile('ChildProfile1')

  try {
    await identityService.setActiveProfile('nonexistent-id')
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof Error, 'throws an error')
  }

  await store.close()
})

test('get active without identity throws', async (t) => {
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
  const identityService = new IdentityService(store)

  try {
    await identityService.getActiveProfile()
    t.fail('should have thrown')
  } catch (err) {
    t.ok(err instanceof IdentityRequiredError, 'throws IdentityRequiredError')
  }

  await store.close()
})

test('getCollections() returns empty array', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')

  const collections = await identityService.getCollections()

  t.is(collections.length, 0, 'returns empty array')

  await store.close()
})

test('getPlaylists(profileId) returns empty array', async (t) => {
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
  const identityService = new IdentityService(store)

  await identityService.createIdentity('TestUser')
  const profile = await identityService.createProfile('ChildProfile1')

  const playlists = await identityService.getPlaylists(profile.id)

  t.is(playlists.length, 0, 'returns empty array')

  await store.close()
})
