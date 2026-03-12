# Recommended Practices, FAQ & Troubleshooting

Sourced from docs.pears.com/reference/recommended-practices, /faq, and /troubleshooting.

---

## Recommended Practices

### Use One Corestore Instance Per Application

**Don't create multiple Corestore instances.** Multiple instances against the same storage cause file locking errors. Multiple instances against different storages cause duplicate core storage.

One Corestore:
- Reduces open file handles
- Deduplicates Hypercore storage
- Requires only one replication stream per peer

```js
// ✅ correct — one store, use namespaces to separate concerns
const store = new Corestore(Pear.app.storage + '/corestore')
const appCore  = store.namespace('app').get({ name: 'main' })
const chatCore = store.namespace('chat').get({ name: 'messages' })

// ❌ wrong — two stores, causes lock errors and wasted storage
const store1 = new Corestore('./storage-a')
const store2 = new Corestore('./storage-b')
```

### Use One Hyperswarm Instance Per Application

**Don't create multiple Hyperswarm instances.** Hyperswarm supports joining multiple topics on a single instance and deduplicates peer connections between them. Multiple instances create redundant DHT records, slow down connections, and bloat connection count.

```js
// ✅ correct — one swarm, join multiple topics
const swarm = new Hyperswarm()
swarm.join(topic1)
swarm.join(topic2)
swarm.on('connection', conn => store.replicate(conn))

// ❌ wrong
const swarm1 = new Hyperswarm()
const swarm2 = new Hyperswarm()
```

### Never Load JavaScript Over HTTP(S)

HTTP/HTTPS traffic is **blocked by default** in Pear applications. This is intentional — loading external JS is a supply chain attack vector, especially dangerous for apps with native filesystem access. Don't try to work around this.

If you need external data, use the P2P stack or fetch JSON/data (not scripts).

### Prune Dev Dependencies Before Staging

Dev dependencies bloat your bundle and aren't needed at runtime. Before staging:

```bash
npm prune --omit=dev
pear stage production
```

Or add dev-only paths to `pear.stage.ignore`.

### Always Explicitly Ignore `.git`

`.git` is excluded by default — **but only if you don't define a custom `stage.ignore`**. Once you add any `ignore` entries, the defaults are overridden and `.git` must be listed explicitly:

```json
{
  "pear": {
    "stage": {
      "ignore": [".git", "test/", ".env", "*.md"]
    }
  }
}
```

### Always Destroy Hyperswarm in Teardown

Not destroying Hyperswarm on exit leaves stale DHT records, which causes other peers to take longer to join your topics in future sessions.

```js
Pear.teardown(() => swarm.destroy())
```

If you destroy the swarm before teardown for some reason, unregister the teardown callback to avoid a double-destroy.

### Always Use `Pear.app.storage` for Persistent Data

Never use relative paths (`./data`) for storage — they point into the app bundle, not a writable location. Always:

```js
const store = new Corestore(Pear.app.storage + '/corestore')
```

---

## Frequently Asked Questions

### Can I use TypeScript?

Yes — compile to JavaScript first, then load the compiled output as your `main` entrypoint. Pear doesn't run TypeScript directly.

### Can I use other languages?

JavaScript only, natively. Other languages can be integrated via native addons using [`bare-addon`](https://github.com/holepunchto/bare-addon) as a template.

### How do I distribute a binary / installable app?

Use [`pear-appling`](https://github.com/holepunchto/pear-appling/) — a template that compiles a small platform-bootstrapping binary for macOS, Linux, and Windows. The binary fetches and runs the latest version of your app from peers on first launch. You rarely need to recompile it after that — updates flow through the P2P network automatically.

### How do I write one codebase for desktop + mobile + terminal?

Put all business logic and P2P code in a "Pear-end" — a separate worker/thread that communicates to the UI via IPC. The UI code changes per platform, but the Pear-end is reused.

Note: `global.Pear` API is not currently supported in mobile apps. This is expected to change in Pear v2.

### Do I have to keep `pear seed` running?

Not strictly — any peer running your app will reseed it to others. But for reliable availability, keep a `pear seed` process running somewhere. No seed = app unreachable when no users are active.

### Can peers see my IP address?

Yes. IP addresses are exchanged with peers to establish connections. Use a VPN if you need to protect your IP.

### How do I list / uninstall apps?

```bash
pear data apps          # list installed apps
pear drop <link>        # ⚠️ destructive — permanently deletes app storage
```

Full uninstall is not currently supported.

### Where is Pear data stored on disk?

| OS      | Path |
|---------|------|
| macOS   | `~/Library/Application Support/pear` |
| Linux   | `~/.config/pear` |
| Windows | `%USERPROFILE%\AppData\Roaming\pear` |

App files are stored as Hyperdrives (not plain files). Use `pear dump <link> ./out` to inspect them.

### Why does Pear use npm for dependencies?

npm is familiar, all Holepunch packages are published there, and `node_modules` are staged with the app and replicated via the swarm. After initial `pear` install, npm and Node.js are not required to *run* Pear apps — only to install dependencies.

---

## Troubleshooting

### `Error: While lock file ... Resource temporarily unavailable`

```
Error: While lock file: .../db/LOCK: Resource temporarily unavailable
```

Two causes:
1. **App opened the same storage twice** — you have multiple Corestore instances pointing to the same path. Use one Corestore.
2. **Multiple processes running for the same app** — kill stale processes and rerun.

### Hyperswarm topic takes a long time to join

Common causes:
- **NAT traversal** — some network configurations (symmetric NAT) require relay assistance and are slow by nature
- **Stale DHT records** — you didn't call `swarm.destroy()` in teardown last time. Add `Pear.teardown(() => swarm.destroy())`.
- **Firewall** — if traffic is being blocked, check your firewall rules

### `Pear.teardown` fires but app keeps running

Something is holding the event loop open. Most common cause: a worker pipe not being ended. Call `pipe.end()` to gracefully close it in your teardown handler.

### `pear` CLI exits without running the app

Debug steps in order:
```bash
pear --log <command>              # step 1: enable pear logs
pear sidecar --log-level 3        # step 2: run sidecar with verbose logs
ps aux | grep pear                # step 3: check for zombie pear processes
```

Crash logs are in the platform's `current` directory:
- `sidecar.crash.log`
- `electron-main.crash.log`
- `cli.crash.log`

If sidecar stops at `"Closing any current Sidecar clients..."` — the sidecar is hanging. Kill all pear processes (note: this closes Keet and other running apps).

### `Uncaught TypeError: require.addon is not a function` or `Bare is not defined`

You're trying to run a **Bare module inside a Pear desktop app** (Electron). This is not currently supported — Pear desktop apps run in Electron/Node.js, not Bare.

Pear v2 will unify this. For now, keep Bare-specific code in terminal apps or use import maps to support both runtimes:

```json
{
  "imports": {
    "fs": {
      "bare": "bare-fs",
      "default": "fs"
    }
  }
}
```

### `bare-pack` fails with `MODULE_NOT_FOUND: Cannot find module 'node:crypto'`

`bare-pack` scans statically and doesn't evaluate conditionals. If you have:
```js
if (runtime === 'bare') { require('bare-crypto') } else { require('node:crypto') }
```
It tries to pack both branches and fails on `node:crypto` in a Bare context.

Fix: use import maps instead of runtime conditionals. See [`bare-node` import maps](https://github.com/holepunchto/bare-node#import-maps).

### `AddonError: ADDON_NOT_FOUND`

The native addon can't be found. Check:
- Is the addon built for your current `Bare.platform` / `Bare.arch`?
- For mobile: was the addon linked during compilation?
- Try clearing build cache and recompiling.

### Missing Node.js builtins in Bare (`process`, `fs`, etc.)

Bare doesn't include Node.js builtins. Import the `bare-*` equivalent:
```js
import process from 'bare-process'
import fs from 'bare-fs'
```

Or to set as a global (for compatibility with deps that assume the global exists):
```js
import 'bare-process/global'  // now `process` is available globally
```

For third-party Node.js modules that use builtins, install the Bare alias:
```bash
npm i bare-net net@npm:bare-node-net
```
