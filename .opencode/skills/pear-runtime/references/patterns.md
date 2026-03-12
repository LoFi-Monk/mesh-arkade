# App Patterns & Scaffolds

Complete, working starting points. Copy and adapt.

---

## Pattern 1: Minimal Desktop App

### File structure
```
my-desktop-app/
├── package.json
├── index.js        ← entrypoint
└── index.html      ← UI
```

### `package.json`
```json
{
  "name": "my-desktop-app",
  "main": "index.js",
  "type": "module",
  "pear": {
    "pre": "pear-electron/pre",
    "gui": {
      "width": 1024,
      "height": 768,
      "backgroundColor": "#ffffff"
    }
  },
  "dependencies": {
    "pear-electron": "latest",
    "pear-bridge": "latest"
  }
}
```

### `index.js` (app entrypoint — Bare/Node context)
```js
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

const runtime = new Runtime()
await runtime.ready()

const server = new Bridge()
await server.ready()

const pipe = runtime.start({ info: server.info() })
Pear.teardown(() => pipe.end())
```

### `index.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My App</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
  </style>
</head>
<body>
  <h1>Hello Pear</h1>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

### `app.js` (renderer — browser context)
```js
import ui from 'pear-electron'

// Window is ready — do UI work here
console.log('App running, visible:', ui.app.visible)
```

### Run it
```bash
npm install
pear run --dev .
```

---

## Pattern 2: Desktop App with Custom Frameless Titlebar

### `package.json` addition
```json
{
  "pear": {
    "pre": "pear-electron/pre",
    "gui": {
      "width": 1024,
      "height": 768,
      "frame": false,
      "backgroundColor": "#1a1a2e"
    }
  }
}
```

### `index.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a2e; color: white; font-family: sans-serif; }

    .titlebar {
      height: 32px;
      background: #16213e;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      -webkit-app-region: drag;       /* ← makes it draggable */
      -webkit-user-select: none;      /* ← prevent text selection while dragging */
    }

    .titlebar-controls {
      display: flex;
      gap: 8px;
      -webkit-app-region: no-drag;   /* ← buttons must NOT be draggable */
    }

    .titlebar-controls button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }

    .btn-close   { background: #ff5f57; }
    .btn-min     { background: #febc2e; }
    .btn-max     { background: #28c840; }

    .content {
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="titlebar">
    <span>My App</span>
    <div class="titlebar-controls">
      <button class="btn-min"   id="btn-min"></button>
      <button class="btn-max"   id="btn-max"></button>
      <button class="btn-close" id="btn-close"></button>
    </div>
  </div>

  <div class="content">
    <h1>Hello Pear</h1>
  </div>

  <script type="module" src="./app.js"></script>
</body>
</html>
```

### `app.js`
```js
import ui from 'pear-electron'

document.getElementById('btn-close').onclick = () => ui.app.close()
document.getElementById('btn-min').onclick   = () => ui.app.minimize()
document.getElementById('btn-max').onclick   = () => ui.app.maximize()
```

> ⚠️ If the window can't be dragged: check devtools aren't open (breaks drag), and that `-webkit-app-region: drag` is on the titlebar. Only rectangular drag regions are supported.

---

## Pattern 3: Desktop App with P2P Data (Hyperswarm + Hyperbee)

A desktop app that connects to peers and syncs a key-value store.

### `package.json`
```json
{
  "name": "my-p2p-desktop",
  "main": "index.js",
  "type": "module",
  "pear": {
    "pre": "pear-electron/pre",
    "gui": { "width": 1024, "height": 768 }
  },
  "dependencies": {
    "pear-electron": "latest",
    "pear-bridge": "latest",
    "corestore": "^6",
    "hyperswarm": "^4",
    "hyperbee": "^2"
  }
}
```

### `index.js` (entrypoint — P2P setup happens here)
```js
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'

// Set up P2P
const store = new Corestore(Pear.app.storage + '/corestore')
const swarm = new Hyperswarm()
const core  = store.get({ name: 'main-db' })
const db    = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
await db.ready()

swarm.on('connection', conn => store.replicate(conn))
swarm.join(core.discoveryKey)

// Make db available to renderer via global (or use pear-bridge API routes)
globalThis.db = db

// Start UI
const runtime = new Runtime()
await runtime.ready()
const server = new Bridge()
await server.ready()
const pipe = runtime.start({ info: server.info() })

Pear.teardown(async () => {
  pipe.end()
  await swarm.destroy()
  await store.close()
})
```

> ⚠️ The renderer (HTML/browser context) cannot directly import Node/Bare modules like `corestore`. P2P logic must live in `index.js`. Use `pear-bridge` routes or `globalThis` to expose data to the renderer if needed.

---

## Pattern 4: Terminal App

### `package.json`
```json
{
  "name": "my-terminal-app",
  "main": "index.js",
  "type": "module",
  "pear": {
    "name": "my-terminal-app"
  },
  "dependencies": {
    "hyperswarm": "^4",
    "corestore": "^6",
    "hyperbee": "^2"
  }
}
```

### `index.js`
```js
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'
import readline from 'bare-readline'  // or 'readline' in compat mode

const store  = new Corestore(Pear.app.storage + '/corestore')
const swarm  = new Hyperswarm()
const core   = store.get({ name: 'db' })
const db     = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
await db.ready()

swarm.on('connection', conn => store.replicate(conn))
swarm.join(core.discoveryKey)
await swarm.flush()

console.log('Connected. App key:', core.key.toString('hex'))

// simple REPL loop
const rl = readline.createInterface({ input: process.stdin })
rl.on('line', async line => {
  const [cmd, ...args] = line.trim().split(' ')
  if (cmd === 'put')  await db.put(args[0], args[1])
  if (cmd === 'get')  console.log(await db.get(args[0]))
  if (cmd === 'quit') Pear.exit(0)
})

Pear.teardown(async () => {
  rl.close()
  await swarm.destroy()
  await store.close()
})
```

### Run it
```bash
pear run --dev .
```

---

## Pattern 5: Two Peers Connecting Directly (P2P Chat)

### `index.js`
```js
import DHT from 'hyperdht'
import readline from 'bare-readline'

const dht = new DHT()
const isServer = !Pear.app.args.includes('--connect')

if (isServer) {
  const server = dht.createServer(conn => {
    console.log('Peer connected!')
    process.stdin.pipe(conn)
    conn.pipe(process.stdout)
  })
  await server.listen()
  console.log('Your key:', server.publicKey.toString('hex'))
  console.log('Share this key, then the other peer runs:')
  console.log('  pear run --dev . --connect <key>')
} else {
  const keyIndex = Pear.app.args.indexOf('--connect')
  const peerKey  = Buffer.from(Pear.app.args[keyIndex + 1], 'hex')
  const conn     = dht.connect(peerKey)
  conn.on('open', () => console.log('Connected!'))
  process.stdin.pipe(conn)
  conn.pipe(process.stdout)
}

Pear.teardown(() => dht.destroy())
```

---

## Pattern 6: Using `pear-updates` for Hot Updates

```js
import Updates from 'pear-updates'

const updates = new Updates()

for await (const update of updates) {
  if (update.app) {
    console.log('App updated to version:', update.app.length)
    // optionally restart:
    // import { restart } from 'pear-restart'
    // await restart()
  }
  if (update.platform) {
    console.log('Platform updated')
  }
}
```

---

## Storage Path Pattern

Always store persistent data relative to `Pear.app.storage` — this is the correct, sandboxed path for your app's data:

```js
const store = new Corestore(Pear.app.storage + '/corestore')
// or
import path from 'bare-path'
const storagePath = path.join(Pear.app.storage, 'mydata')
```

Never use `./` relative paths for storage — they point to the app bundle, not a writable location.
