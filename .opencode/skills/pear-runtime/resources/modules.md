# Pear Modules Reference

Pear's global API is intentionally minimal. Functionality is delivered via installable `pear-*` modules.

> Source: https://github.com/holepunchto — check individual repos for latest APIs.

## Table of Contents
- [Deprecated API → Replacement Mapping](#deprecated-api--replacement-mapping)
- [Application Modules](#application-modules)
- [UI Modules (Desktop)](#ui-modules-desktop)
- [Common / Utility Modules](#common--utility-modules)
- [Developer Modules](#developer-modules)

---

## Deprecated API → Replacement Mapping

When you see old code using these, replace them:

| Deprecated | Replacement |
|------------|-------------|
| `Pear.config` | `Pear.app` |
| `Pear.restart()` | `pear-restart` module |
| `Pear.messages([pattern], [listener])` | `pear-messages` module |
| `await Pear.message(obj)` | `pear-message` module |
| `Pear.worker` | `pear-run` + `pear-pipe` |
| `Pear.media` | `pear-electron` → `ui.media` |
| `Pear.updates(listener)` | `pear-updates` module |
| `Pear.wakeups(listener)` | `pear-wakeups` module |
| `Pear.reload()` | `location.reload()` (Desktop only) |
| `Pear.badge(count)` | `pear-electron` → `ui.app.badge()` |
| `Pear.tray(options, listener)` | `pear-electron` → `ui.app.tray()` |
| `new Pear.Window(entry, options)` | `pear-electron` → `new ui.Window(...)` |
| `new Pear.View(options)` | `pear-electron` → `new ui.View(...)` |

---

## Application Modules

### `pear-updates`
Receive platform and application update notifications.

```js
import updates from 'pear-updates'

for await (const update of updates()) {
  console.log('update available:', update)
  // Reload or notify user
}
```

### `pear-wakeups`
Receive wakeup events (e.g., when user clicks a `pear://` link externally).

```js
import wakeups from 'pear-wakeups'

for await (const wakeup of wakeups()) {
  console.log('wakeup link:', wakeup.link)
}
```

### `pear-messages`
Receive inter-app messages that match a pattern.

```js
import messages from 'pear-messages'

for await (const msg of messages({ type: 'chat' })) {
  console.log(msg)
}
```

### `pear-message`
Send a message to another Pear app.

```js
import message from 'pear-message'

await message({ type: 'chat', text: 'hello' })
```

### `pear-run`
Run a Pear child application by link. Returns a pipe.

```js
import run from 'pear-run'

const child = run('pear://some-app-key', ['--arg1'])
child.on('data', d => console.log('child says:', d.toString()))
child.write('hello child')
```

### `pear-pipe`
Used in a child app to connect back to the parent's pipe (the other end of `pear-run`).

```js
import pipe from 'pear-pipe'

pipe.write('hello parent')
pipe.on('data', d => console.log('parent says:', d.toString()))
```

### `pear-crasher`
Log uncaught exceptions and unhandled rejections to a file instead of silently dying.

```js
import 'pear-crasher'   // just import it — handles setup automatically
```

### `pear-user-dirs`
Get platform-appropriate user directories.

```js
import { home, data, config, cache, temp } from 'pear-user-dirs'

console.log(home())    // /Users/alice
console.log(data())    // /Users/alice/Library/Application Support (macOS)
```

---

## UI Modules (Desktop)

### `pear-electron`
The UI library for Desktop Pear apps. Provides Windows, Views, media access, tray, dock, etc.

```js
import ui from 'pear-electron'

await ui.ready()

// Create a window
const win = new ui.Window('/index.html', {
  show: false,
  height: 600,
  width: 800,
  backgroundColor: '#1a1a1a'
})

await win.open()
await win.show()

// Window methods
await win.focus()
await win.minimize()
await win.maximize()
await win.restore()
await win.close()

// App-level
await ui.app.badge(5)         // badge count (macOS/Windows)
const untray = await ui.app.tray({ icon: '/icon.png' }, () => win.show())

// BrowserView-like
const view = new ui.View({ ... })

// Media
const { video, audio } = await ui.media.desktopSources({ types: ['screen'] })
```

### `pear-bridge`
Local HTTP bridge for `pear-electron` apps. Useful when you need to serve files locally or bridge to HTTP clients.

```js
import bridge from 'pear-bridge'
// See GitHub README for API — this is an advanced module
```

### `pear-hotmods`
Live reload for `pear-electron` Desktop apps during development. Framework-agnostic.

```js
import 'pear-hotmods'   // import in your dev entry — handles HMR setup
```

---

## Common / Utility Modules

### `pear-link`
Parse and serialize `pear://` links, including alias resolution.

```js
import Link from 'pear-link'

const link = new Link('pear://keet')
console.log(link.key)       // resolved public key Buffer
console.log(link.pathname)  // '/'
console.log(link.toString()) // full pear:// link

const built = Link.from({ key: myKey, pathname: '/path' })
```

### `pear-dump`
Sync files from a `pear://` link to a local directory (programmatic version of `pear dump`).

```js
import dump from 'pear-dump'

for await (const diff of dump('pear://some-link', './output-dir')) {
  console.log(diff.op, diff.key)
}
```

### `pear-seed`
Seed or reseed a Pear app drive by link (programmatic `pear seed`).

```js
import seed from 'pear-seed'

for await (const status of seed('pear://some-link')) {
  console.log(status)
}
```

### `pear-stage`
Sync from local disk to app drive (programmatic `pear stage`).

```js
import stage from 'pear-stage'

for await (const diff of stage('my-channel', './app-dir')) {
  console.log(diff.op, diff.key)
}
```

### `pear-release`
Set production release version length programmatically.

```js
import release from 'pear-release'

await release('my-channel')            // release at latest
await release('my-channel', { checkout: 500 })  // release at specific length
```

### `pear-info`
Read Pear project information by link.

```js
import info from 'pear-info'

const data = await info('pear://some-link')
console.log(data.key, data.length, data.fork)
```

### `pear-gracedown`
Graceful closer — pairs with `pipe.autoexit = false` to control app shutdown.

```js
import gracedown from 'pear-gracedown'

gracedown(() => {
  // cleanup before exit
  console.log('closing gracefully')
})
```

### `pear-inspect`
Enable remote debugging over Hyperswarm (securely — only peers with the key can attach).

```js
import { enable } from 'pear-inspect'

const { key } = await enable()
console.log('inspector key:', key.toString('hex'))
// Connect devtools via: pear run --inspect-key <key>
```

---

## Developer Modules

### `pear-appdrive`
Read-only Hyperdrive interface for the application's own drive.

```js
import appdrive from 'pear-appdrive'

const drive = appdrive()
const content = await drive.get('/some-bundled-file.json')
```

Useful for reading files that were staged with the app without going through the filesystem.

---

## package.json `pear` Config Reference

```json
{
  "name": "my-app",
  "main": "index.html",
  "pear": {
    "name": "my-app",
    "type": "desktop",
    "gui": {
      "backgroundColor": "#1a1a1a",
      "height": 540,
      "width": 720,
      "minWidth": 400,
      "minHeight": 300,
      "frameless": false,
      "transparent": false
    },
    "links": ["pear://trusted-app"],
    "stage": {
      "entrypoints": ["./worker.js"],
      "ignore": ["test/", ".git/"],
      "includes": ["assets/"],
      "defer": ["optional-peer-dep"]
    },
    "pre": "./scripts/pre.js"
  }
}
```

Key config fields:
- `type` — `"terminal"` or `"desktop"`
- `gui` — Desktop window defaults (width, height, backgroundColor, frameless, transparent, etc.)
- `links` — trusted `pear://` or `https://` links allowed in the app
- `stage.entrypoints` — extra JS entrypoints for bundler analysis
- `stage.ignore` — paths to exclude from staging
- `stage.includes` — paths to force-include (for non-JS assets or dynamic requires)
- `stage.defer` — optional/peer dependency specifiers to skip during static analysis
- `pre` — script to run before `pear run` from disk or `pear stage`