# P2P Stack Reference

> Source of truth: GitHub READMEs at https://github.com/holepunchto/<module>
> Docs at docs.pears.com may lag production. Always verify against GitHub when in doubt.

## Table of Contents
- [Hypercore](#hypercore) — append-only log
- [Hyperbee](#hyperbee) — KV store
- [Hyperdrive](#hyperdrive) — P2P filesystem
- [Autobase](#autobase) — multi-writer
- [Hyperswarm](#hyperswarm) — peer discovery
- [HyperDHT](#hyperdht) — low-level DHT
- [Corestore](#corestore) — core manager
- [Localdrive & Mirrordrive](#localdrive--mirrordrive)
- [SecretStream & Protomux](#secretstream--protomux)

---

## Hypercore

Secure, distributed, append-only log. The fundamental building block.

```js
import Hypercore from 'hypercore'

const core = new Hypercore(storage, [key], [options])
// storage: string path, or RAM: () => new RAM()
// key: hex string or Buffer — omit to create a new core
// options: { sparse, valueEncoding, crypto, ... }

await core.ready()

core.key          // Buffer(32) — public key
core.discoveryKey // Buffer(32) — use this to join swarm
core.length       // number of blocks
core.byteLength   // total bytes stored
core.writable     // true if you own this core
core.readable     // always true

// Write
await core.append(buffer | string | object)  // single block
await core.append([a, b, c])                 // batch

// Read
const block = await core.get(index)          // returns Buffer
const range = core.createReadStream({ start, end, live })

// Replicate (pass sockets from Hyperswarm)
const stream = core.replicate(isInitiator, { live: true })
socket.pipe(stream).pipe(socket)

// Events
core.on('append', () => {})   // new data available
core.on('close', () => {})

await core.close()
```

**Key patterns:**
- Never store the secret key — only the public key is needed to read.
- Use `core.discoveryKey` (not `core.key`) to announce on the swarm.
- Pass `{ sparse: true }` to only download blocks you explicitly request.

---

## Hyperbee

An append-only B-tree on top of a Hypercore. Acts as a sorted key-value database.

```js
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'

const core = new Hypercore('./bee-data')
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',     // 'utf-8' | 'binary' | 'json' | compact-encoding codec
  valueEncoding: 'json'
})

await bee.ready()

// Write
await bee.put(key, value)
await bee.del(key)

// Read
const node = await bee.get(key)   // { key, value } or null
const exists = !!(await bee.get(key))

// Range queries (sorted)
for await (const { key, value } of bee.createReadStream({ gt: 'a', lt: 'z' })) {
  console.log(key, value)
}
// gte, lte, gt, lt, limit, reverse all supported

// Batch writes
const batch = bee.batch()
await batch.put('k1', 'v1')
await batch.put('k2', 'v2')
await batch.flush()

// Sub-databases (prefix namespacing)
const users = bee.sub('users:', { valueEncoding: 'json' })
await users.put('alice', { age: 30 })

// Replicate via Hypercore
swarm.on('connection', socket => core.replicate(socket))
swarm.join(core.discoveryKey)

await bee.close()
```

---

## Hyperdrive

A P2P filesystem. Files stored on a Hypercore, replicated across peers.

```js
import Hyperdrive from 'hyperdrive'
import Corestore from 'corestore'

const store = new Corestore('./drive-storage')
const drive = new Hyperdrive(store)
await drive.ready()

drive.key          // Buffer — share this to let others read
drive.discoveryKey // use for swarm announcement

// Files
await drive.put('/path/file.txt', Buffer.from('hello'))
const buf = await drive.get('/path/file.txt')
await drive.del('/path/file.txt')

// Metadata
const entry = await drive.entry('/path/file.txt')
// { seq, key, value: { executable, linkname, blob, metadata } }

// List files
for await (const file of drive.list('/')) {
  console.log(file.key)
}

// Streams
const readStream = drive.createReadStream('/file.txt')
const writeStream = drive.createWriteStream('/file.txt')

// Replicate
swarm.on('connection', socket => store.replicate(socket))
swarm.join(drive.discoveryKey)

await drive.close()
```

**Note:** Hyperdrive uses Corestore internally. Pass a Corestore (or path) as storage.

---

## Autobase

Multi-writer layer — lets multiple peers append to a shared "virtual" Hypercore. Essential for collaborative apps.

```js
import Autobase from 'autobase'
import Corestore from 'corestore'

const store = new Corestore('./autobase-storage')

const base = new Autobase(store, remoteKey, {
  open (store) {
    // create your view (e.g., Hyperbee) here
    return new Hyperbee(store.get('view'), { ... })
  },
  async apply (nodes, view, base) {
    // process each appended node into the view
    for (const node of nodes) {
      const op = JSON.parse(node.value)
      if (op.type === 'put') await view.put(op.key, op.value)
    }
  }
})

await base.ready()

// Append (only works on your own writable core)
await base.append(JSON.stringify({ type: 'put', key: 'foo', value: 'bar' }))

// Read from the view (consistent ordered state)
const val = await base.view.get('foo')

// Allow another writer
await base.addWriter(otherPeerKey)

// Replicate
swarm.on('connection', socket => store.replicate(socket))
swarm.join(base.discoveryKey)

await base.close()
```

**Key concepts:**
- Each peer writes to their own Hypercore.
- Autobase linearizes all writers' cores into a consistent view.
- The `apply` function is your state machine — must be deterministic.
- `open` should return the view object (e.g., Hyperbee on an autobase-managed core).

---

## Hyperswarm

High-level P2P networking: find peers by topic and establish encrypted connections.

```js
import Hyperswarm from 'hyperswarm'

const swarm = new Hyperswarm()

// Join a topic (32-byte Buffer)
const discovery = swarm.join(topic, {
  server: true,   // announce yourself as a server on this topic
  client: true    // look for servers on this topic
})

await discovery.flushed() // wait until initial peer discovery is done

// Handle connections
swarm.on('connection', (socket, peerInfo) => {
  peerInfo.publicKey   // Buffer — peer's public key
  peerInfo.topics      // topics this peer is on

  socket.write('hello')
  socket.on('data', data => console.log(data.toString()))
  socket.on('close', () => console.log('peer left'))
  socket.on('error', err => console.error(err))
})

// Leave a topic
await swarm.leave(topic)

// Destroy (close all connections)
await swarm.destroy()
```

**Common pattern — replicate a Hypercore over swarm:**
```js
swarm.on('connection', socket => core.replicate(socket))
swarm.join(core.discoveryKey, { server: true, client: true })
```

**Common pattern — replicate a Corestore over swarm (for drives/autobase):**
```js
swarm.on('connection', socket => store.replicate(socket))
swarm.join(drive.discoveryKey, { server: true, client: true })
```

---

## HyperDHT

Low-level DHT powering Hyperswarm. Use directly when you need direct keypair-addressed connections (not topic-based).

```js
import HyperDHT from 'hyperdht'
import crypto from 'hypercore-crypto'

// Server side
const dht = new HyperDHT()
const keyPair = HyperDHT.keyPair()  // or crypto.keyPair()

const server = dht.createServer(socket => {
  socket.write('hello from server')
  socket.on('data', d => console.log(d.toString()))
})

await server.listen(keyPair)
console.log('server key:', keyPair.publicKey.toString('hex'))

// Client side
const dht2 = new HyperDHT()
const socket = dht2.connect(serverPublicKey)
socket.write('hello from client')
socket.on('data', d => console.log(d.toString()))

// Cleanup
await server.close()
await dht.destroy()
await dht2.destroy()
```

Use **Hyperswarm** for most apps. Use **HyperDHT** directly when you need fine-grained control or server/client roles with known key pairs.

---

## Corestore

Manages a collection of Hypercores, all stored together. Required by Hyperdrive and Autobase.

```js
import Corestore from 'corestore'

const store = new Corestore('./storage-dir')
await store.ready()

// Get a named core (stable across sessions)
const core = store.get({ name: 'my-feed' })

// Get by public key
const readonlyCore = store.get({ key: Buffer.from(hexKey, 'hex') })

// Replicate all cores at once (use with Hyperswarm)
swarm.on('connection', socket => store.replicate(socket))

// Namespace — useful for sub-components
const subStore = store.namespace('chat')
const chatCore = subStore.get({ name: 'messages' })

await store.close()
```

---

## Localdrive & Mirrordrive

**Localdrive** — treats a local filesystem directory like a Hyperdrive (same API).

```js
import Localdrive from 'localdrive'

const local = new Localdrive('./my-folder')
const buf = await local.get('/file.txt')
await local.put('/file.txt', Buffer.from('hello'))
for await (const file of local.list('/')) console.log(file.key)
```

**Mirrordrive** — syncs between any two drives (Hyperdrive ↔ Localdrive, or Hyperdrive ↔ Hyperdrive).

```js
import Localdrive from 'localdrive'
import Hyperdrive from 'hyperdrive'
import Mirrordrive from 'mirror-drive'

const local = new Localdrive('./src')
const remote = new Hyperdrive(store)

// Mirror local → remote
const mirror = new Mirrordrive(local, remote)
await mirror.done()  // resolves when sync is complete

// Common use: stage local files to a Hyperdrive before seeding
```

---

## SecretStream & Protomux

**SecretStream** (`@hyperswarm/secret-stream`) — encrypted, authenticated stream between two peers. Hyperswarm connections are already SecretStreams.

**Protomux** — multiplex multiple protocol channels over one stream (e.g., one connection serving multiple sub-protocols).

```js
import Protomux from 'protomux'
import { Message } from 'protomux'

const mux = new Protomux(socket)  // socket from Hyperswarm

const channel = mux.createChannel({
  protocol: 'my-protocol',
  id: Buffer.alloc(32),
  onopen () { console.log('channel opened') },
  onclose () { console.log('channel closed') }
})

const msg = channel.addMessage({
  encoding: cenc.string,
  onmessage (data) { console.log('received:', data) }
})

channel.open()
msg.send('hello')
```

Most apps won't need Protomux directly — Hyperswarm handles multiplexing for replication automatically.
