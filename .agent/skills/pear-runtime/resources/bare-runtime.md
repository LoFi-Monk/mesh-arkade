# Bare Runtime Reference

Bare is the JavaScript runtime underlying Pear. It is similar to Node.js but smaller, mobile-first, and embedding-focused.

> GitHub: https://github.com/holepunchto/bare
> Bare is NOT Node.js. Do not assume Node.js built-ins are available.

## global.Bare API

```js
Bare.platform    // 'android' | 'darwin' | 'ios' | 'linux' | 'win32'
Bare.arch        // 'arm' | 'arm64' | 'ia32' | 'mips' | 'mipsel' | 'x64'
Bare.simulator   // Boolean — true if running in a simulator
Bare.argv        // Array — raw command-line arguments
Bare.pid         // Number — process ID
Bare.exitCode    // Number — default exit code
Bare.suspended   // Boolean
Bare.exiting     // Boolean
Bare.version     // String — Bare version
Bare.versions    // Object — version strings for Bare and dependencies

// Process control
Bare.exit([code])              // immediate exit (no teardown — use Pear.exit() in Pear apps)
Bare.suspend([linger])         // suspend process and all threads
Bare.idle()                    // immediately suspend event loop → emits 'idle'
Bare.resume()                  // resume after suspension

// Events
Bare.on('uncaughtException', err => {})
Bare.on('unhandledRejection', (reason, promise) => {})
Bare.on('beforeExit', code => {})
Bare.on('exit', code => {})
Bare.on('suspend', linger => {})
Bare.on('idle', () => {})
Bare.on('resume', () => {})
```

**In Pear apps, prefer `Pear.exit()` over `Bare.exit()`** — Pear.exit() runs teardown handlers first.

## Threads (Bare.Thread)

Bare supports lightweight threads (similar to Node.js Workers but simpler API).

```js
// Main thread
const thread = new Bare.Thread('./worker.js', { data: Buffer.from('hello') })
thread.join()  // block until thread exits

// Worker thread (worker.js)
// Bare.Thread.isMainThread === false
// Bare.Thread.self.data contains the passed buffer
Bare.exit(0)
```

## Native Addons (Bare.Addon)

```js
const addon = Bare.Addon.load(url)          // load native addon
const unloaded = Bare.Addon.unload(url)     // unload (returns bool)
const url = Bare.Addon.resolve(spec, parentURL) // resolve path
```

---

## Key Differences from Node.js

| Feature | Node.js | Bare |
|---------|---------|------|
| `require()` | CJS built-in | ESM default; no `require` |
| `process` global | Yes | No — use `Bare.*` |
| `__dirname`, `__filename` | Yes | No — use `import.meta.url` |
| `Buffer` | Global | `import { Buffer } from 'bare-buffer'` |
| `fs`, `path`, `crypto` etc. | Built-in | `bare-fs`, `bare-path`, `bare-crypto` etc. |
| `fetch` | Node 18+ | `bare-fetch` module |
| `WebSocket` | Node 22+ | `bare-ws` module |
| Workers | `worker_threads` | `Bare.Thread` |
| `setTimeout`, `setInterval` | Global | `bare-timers` (or global in Pear context) |

---

## bare-* Standard Library

Install each module separately: `npm i bare-<name>`

### Filesystem — `bare-fs`
```js
import fs from 'bare-fs'

const data = await fs.promises.readFile('./file.txt', 'utf8')
await fs.promises.writeFile('./out.txt', 'hello')
await fs.promises.mkdir('./dir', { recursive: true })
const files = await fs.promises.readdir('./dir')
```

### Path — `bare-path`
```js
import path from 'bare-path'

path.join('/foo', 'bar', 'baz.txt')  // '/foo/bar/baz.txt'
path.resolve('./relative')
path.dirname('/foo/bar.txt')         // '/foo'
path.basename('/foo/bar.txt')        // 'bar.txt'
path.extname('/foo/bar.txt')         // '.txt'
```

### Crypto — `bare-crypto`
```js
import crypto from 'bare-crypto'

crypto.randomBytes(32)                      // Buffer
crypto.createHash('sha256').update(data).digest('hex')
crypto.createHmac('sha256', key)
```

### OS — `bare-os`
```js
import os from 'bare-os'

os.platform()    // 'darwin' | 'linux' | 'win32' | 'android' | 'ios'
os.arch()
os.homedir()
os.tmpdir()
os.hostname()
os.cpus()
```

### Streams — `bare-stream`
Streams compatible with Node.js streams API (Readable, Writable, Transform, Duplex).

```js
import { Readable, Writable, Transform, pipeline } from 'bare-stream'
```

### Fetch — `bare-fetch`
```js
import fetch from 'bare-fetch'

const res = await fetch('https://example.com/api')
const json = await res.json()
```

### WebSocket — `bare-ws`
```js
import WebSocket from 'bare-ws'

const ws = new WebSocket('wss://example.com')
ws.on('open', () => ws.send('hello'))
ws.on('message', msg => console.log(msg))
```

### HTTP — `bare-http1`
```js
import http from 'bare-http1'

const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('hello')
})
server.listen(3000)
```

### Events — `bare-events`
```js
import EventEmitter from 'bare-events'

class MyEmitter extends EventEmitter {}
const emitter = new MyEmitter()
emitter.on('data', d => console.log(d))
emitter.emit('data', 'hello')
```

### Subprocess — `bare-subprocess`
```js
import { spawn } from 'bare-subprocess'

const child = spawn('ls', ['-la'])
child.stdout.on('data', d => console.log(d.toString()))
await child.wait()
```

### Workers — `bare-worker`
Higher-level worker threads (wraps `Bare.Thread`).

```js
import Worker from 'bare-worker'

const worker = new Worker('./worker.js', { data: Buffer.from('init') })
worker.on('message', msg => console.log(msg))
worker.postMessage('hello')
```

### Channel (inter-thread messaging) — `bare-channel`
```js
import Channel from 'bare-channel'

const [portA, portB] = Channel.pair()
portA.on('message', msg => console.log(msg))
portB.send('hello from other thread')
```

### Console — `bare-console`
WHATWG-compatible console. Usually available as global `console` in Pear context.

### URL — `bare-url`
WHATWG URL implementation.

```js
import { URL, URLSearchParams } from 'bare-url'

const url = new URL('https://example.com/path?q=1')
console.log(url.hostname, url.pathname, url.searchParams.get('q'))
```

### Buffer — `bare-buffer`
Node.js-compatible Buffer API.

```js
import { Buffer } from 'bare-buffer'

const buf = Buffer.from('hello', 'utf8')
const hex = buf.toString('hex')
```

### Readline — `bare-readline`
Interactive CLI line editing with history.

```js
import readline from 'bare-readline'

const rl = readline.createInterface({ input: process.stdin })
rl.on('line', line => console.log('got:', line))
```

---

## Node.js Compatibility Mode

If you need Node.js built-ins, use the `node-compat` template or add `bare-node` compatibility shims.

```bash
pear init node-compat ./my-app
```

Or individually install shims from https://github.com/holepunchto/bare-node

---

## Module System

Bare uses ESM by default. CommonJS is supported via addon but not the default.

```js
// Good — ESM
import fs from 'bare-fs'
import { something } from './local.js'
export default myThing

// Use import.meta.url for file paths
import { fileURLToPath } from 'bare-url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

---

## Pear App Entry Points

**Terminal app (`index.js`):**
```js
import Hyperswarm from 'hyperswarm'

// Pear.teardown for cleanup
Pear.teardown(async () => {
  await swarm.destroy()
})

// App logic
const swarm = new Hyperswarm()
// ...
```

**Desktop app (`index.html`):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Pear App</title>
</head>
<body>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

In desktop apps, `Pear` and `Bare` globals are available in scripts. The renderer is Chromium (via Electron), so standard Web APIs (DOM, fetch, WebSocket, etc.) are also available alongside Bare modules.