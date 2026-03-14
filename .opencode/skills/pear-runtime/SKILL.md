---
name: pear-runtime
description: Build decentralized P2P applications using the Pear Runtime (by Holepunch). Use this skill whenever the user mentions Pear, Holepunch, HyperCore, Hyperswarm, HyperDHT, Hyperbee, Hyperdrive, Autobase, Corestore, or wants to build decentralized/P2P apps. Also trigger for questions about pear:// links, staging/seeding apps, Bare runtime, or any Holepunch ecosystem module. Always use this skill even if the user just says "p2p app", "zero-infrastructure app", or "unstoppable app" — these are Pear concepts.
---

# Pear Runtime Skill

Pear is a P2P Runtime, Development & Deployment platform by Holepunch. Applications run on the **Bare** JavaScript runtime (not Node.js), are distributed via `pear://` links, and require zero servers or infrastructure.

> ⚠️ **Docs lag reality.** When docs.pears.com conflicts with GitHub source or npm, trust GitHub. Always check READMEs at `https://github.com/holepunchto/<module>` for the most accurate API. If uncertain, say so and tell the user to verify.

## 📓 Before You Start — Read the Annealing Notes

**Always read `references/pear-annealing.md` before starting any Pear task.** It contains hard-won lessons, known gotchas, and unresolved questions from real development on this project. It is more reliable than the official docs for anything that has been encountered before.

**After completing a task**, update `references/pear-annealing.md`:
- If you discovered something new — append it to the appropriate section with a date
- If you answered an open question — mark it `[x]` and add the answer inline
- If a "Lesson Learned" turned out to be wrong — add a correction note below it, don't delete it
- Never delete existing entries. Keep additions concise.

## Quick Mental Model

```
Pear (platform)
  └── Bare (JS runtime, like Node but lighter + mobile-first)
       ├── P2P Stack: HyperDHT → Hyperswarm → SecretStream → Protomux
       ├── Storage: Hypercore → Hyperbee / Hyperdrive / Autobase
       └── App: package.json (pear config) + index.html or index.js
```

## Installation & Setup

```bash
npm i -g pear          # installs pear CLI globally
pear                   # first run fetches platform from peers
pear run pear://keet   # smoke test — opens Keet app
```

Linux also needs: `sudo apt install libatomic1` (or distro equivalent).

## App Types

| Type     | Entry        | UI                        | Run command        |
|----------|-------------|---------------------------|--------------------|
| Desktop  | `index.html` | Electron via `pear-electron` | `pear run --dev .` |
| Terminal | `index.js`   | stdin/stdout              | `pear run --dev .` |
| Mobile   | Bare kit     | React Native / bare-kit   | Platform-specific  |

## package.json Minimum Config

```json
{
  "name": "my-app",
  "main": "index.js",
  "pear": {}
}
```

For desktop apps, point `main` to an HTML file and add `"pre": "pear-electron/pre"`. See `references/package-json.md` for the full config reference.

## Core CLI Commands

```bash
pear init [flags] <link|name> [dir]   # scaffold a new project
pear run [flags] <link|dir>           # run app (use --dev for dev mode)
pear stage <channel|link> [dir]       # push local changes to a channel
pear seed <channel|link> [dir]        # seed/replicate an app
pear release <channel|link> [dir]     # mark a production release version
pear info [link|channel]              # read app info / platform info
pear dump <link> <dir>                # sync files from link to local dir
pear versions                         # print runtime version info
pear touch [channel]                  # create a pear:// link without staging
```

Key `pear run` flags: `--dev` (dev mode + devtools), `--store`/`-s` (custom storage path), `--tmp-store`/`-t` (fresh tmp store), `--checkout` (pin to a version).

Key `pear stage` flags: `--dry-run`, `--compact` (tree-shaking via static analysis), `--ignore <paths>`.

## Global Pear API

Available as `global.Pear` inside any Pear app:

```js
Pear.app.key        // Buffer|null — null means running from disk
Pear.app.dev        // Boolean — true if --dev flag passed
Pear.app.name       // String
Pear.app.storage    // String — path to app storage
Pear.app.args       // Array — CLI args after pear run flags
Pear.app.link       // String — full pear:// link
Pear.app.env        // Object — env vars at startup
Pear.app.flags      // Object — parsed pear run flags
Pear.app.release    // Number — release version length
Pear.app.checkpoint // Any — state restored from last Pear.checkpoint()

Pear.checkpoint(state)   // persist state across restarts → Promise
Pear.teardown(fn)         // register cleanup on unload (can call multiple times)
Pear.exit(code)           // exit with teardown flow (preferred over Bare.exit)
Pear.argv                 // raw CLI argv array
```

> **Deprecated** (do NOT use): `Pear.config`, `Pear.restart()`, `Pear.messages()`,
> `Pear.worker`, `Pear.media`, `Pear.Window`, `Pear.View`, `Pear.updates()`, `Pear.wakeups()`.
> Use replacement modules instead — see `references/modules.md`.

## P2P Building Blocks — Quick Reference

Read `references/p2p-stack.md` for full API details. Summary:

| Module       | Role                                   | Install              |
|--------------|----------------------------------------|----------------------|
| `hypercore`  | Append-only signed log                 | `npm i hypercore`    |
| `hyperbee`   | B-tree KV store on Hypercore           | `npm i hyperbee`     |
| `hyperdrive` | P2P filesystem                         | `npm i hyperdrive`   |
| `autobase`   | Multi-writer collaboration layer       | `npm i autobase`     |
| `hyperdht`   | DHT for direct peer connections        | `npm i hyperdht`     |
| `hyperswarm` | High-level peer discovery & connect    | `npm i hyperswarm`   |
| `corestore`  | Hypercore factory/manager              | `npm i corestore`    |
| `localdrive` | Local filesystem ↔ Hyperdrive compat   | `npm i localdrive`   |
| `mirror-drive` | Sync between drives                  | `npm i mirror-drive` |

## Common Patterns

### Connect two peers (via Hyperswarm)
```js
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'

const swarm = new Hyperswarm()
const topic = crypto.randomBytes(32) // or a fixed known topic

swarm.join(topic, { server: true, client: true })
swarm.on('connection', (socket, info) => {
  console.log('peer connected:', info.publicKey.toString('hex'))
  socket.write('hello peer')
  socket.on('data', d => console.log('got:', d.toString()))
})
```

### Create and replicate a Hypercore
```js
import Hypercore from 'hypercore'
import Hyperswarm from 'hyperswarm'

const core = new Hypercore('./my-data')
await core.ready()

const swarm = new Hyperswarm()
swarm.on('connection', socket => core.replicate(socket))
swarm.join(core.discoveryKey)

await core.append('hello world')
console.log('key:', core.key.toString('hex'))
```

### KV store with Hyperbee
```js
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'

const core = new Hypercore('./bee-storage')
const bee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
await bee.ready()

await bee.put('user:1', { name: 'Alice' })
const entry = await bee.get('user:1')
console.log(entry.value) // { name: 'Alice' }
```

### Detect dev vs production
```js
const fromDisk = Pear.app.key === null      // running locally
const devMode = fromDisk && Pear.app.dev    // also passed --dev flag
```

## Dev → Production Lifecycle

```bash
# 1. Develop locally
pear run --dev .

# 2. Stage to a named channel (generates pear:// key on first stage)
pear stage my-channel .

# 3. Seed so peers can replicate it
pear seed my-channel

# 4. Mark a release version
pear release my-channel

# 5. Share the pear:// link from pear info
pear info my-channel --json
```

## Important Gotchas

- **No Node.js built-ins** — use `bare-*` equivalents (`bare-fs`, `bare-path`, `bare-crypto`, etc.) or enable node-compat via `pear init node-compat`.
- **ESM only** — Bare uses `import`/`export`. No CommonJS `require` by default.
- **Keys are permanent per channel+device** — the first `pear stage <channel>` generates a cryptographic key that never changes.
- **`Pear.app.key === null` when running from disk** — reliable dev check.
- **Sparse replication** — only requested blocks are fetched, not the full history.
- **Seeding keeps apps alive** — no server, so if nobody seeds, the app is unreachable.
- **`pear stage --compact`** uses static analysis; add non-JS or dynamically-required files to `pear.stage.includes` in package.json.
- **`Pear.teardown()`** is the right place for cleanup, not `process.on('exit')`.
- **Storage path** — always use `Pear.app.storage` as the base for persistent data, never `./`.
- **One Corestore, one Hyperswarm per app** — multiple instances cause file lock errors and slow DHT. See `references/practices-faq-troubleshooting.md`.
- **Always `swarm.destroy()` in teardown** — otherwise stale DHT records slow future connections.
- **`.git` is only auto-ignored if you have no custom `stage.ignore`** — once you define any ignore list, add `.git` explicitly.
- **`npm prune --omit=dev` before staging** — dev dependencies bloat the bundle unnecessarily.
- **Bare modules don't run in Pear desktop apps (Electron)** — desktop runs Node.js/Electron, not Bare. Use import maps for cross-runtime modules.

---

## ⚠️ Desktop App (pear-electron) — Known Pain Points

> The official docs are significantly behind for desktop apps. Read `references/desktop-apps.md` first.

**The three things that break most desktop apps:**

1. **Missing `"pre": "pear-electron/pre"`** in `package.json` → runtime never loads. **Required.**
2. **Old bridge API** — use `runtime.start({ info: server.info() })` NOT `runtime.start({ bridge })`.
3. **`require()` in HTML renderer** → doesn't work. Use `<script type="module">` and ESM `import`.

**Frameless windows / custom titlebars:**
- CSS: `-webkit-app-region: drag` on titlebar; `-webkit-app-region: no-drag` on all buttons inside it
- Drag breaks when devtools are open (known Electron issue)
- Window controls: `ui.app.minimize()`, `ui.app.maximize()`, `ui.app.restore()`, `ui.app.close()`
- `window.open()` opens **system browser**, NOT a new app window

**`pear.gui` config goes in `package.json`** (not documented well):
```json
{
  "pear": {
    "pre": "pear-electron/pre",
    "gui": {
      "width": 1024, "height": 768,
      "frame": false,
      "backgroundColor": "#1a1a2e",
      "transparent": false
    }
  }
}
```

---

## ⚠️ Staging & Release — Stale Docs Alert

> Old docs show `pear dev` as a command and outdated channel syntax. It's just `pear stage <channelName>`.

**Find your key at any time:**
```bash
pear info --key production       # just the key
pear info --json production      # full info: key, length, fork, release
pear data apps --json            # all known apps on this device
```

**Exact version link** (for pinning/sharing a specific version):
```
pear://fork.length.key    e.g.  pear://0.47.abc123...
```

**Rollback:** `pear release --checkout 42 production`

**Key tracking inside app at runtime:**
```js
const key     = Pear.app.key?.toString('hex')   // null if running from disk
const version = `${Pear.app.fork}.${Pear.app.length}.${key}`
```

---

## When Docs Fail — Fallback Strategy

**`docs.pears.com` and `github.com/holepunchto/pear-docs` are the same thing** — the repo is the source for the website. Neither is more up to date than the other. Both lag behind the actual module implementations.

When docs are wrong or missing, check in this order:
1. **The module's own GitHub README**: `https://github.com/holepunchto/<module-name>` — this is the most accurate source for any specific module's API (e.g. `pear-electron`, `pear-bridge`, `hyperswarm`)
2. **Open issues on the module repo** — known bugs, API changes in progress, workarounds from other users
3. **Open issues on pear itself**: `https://github.com/holepunchto/pear/issues`
4. **Official examples**: `https://github.com/holepunchto/pear/tree/main/examples`
5. **The annealing notes**: `references/pear-annealing.md` — real lessons from this project

---

## Reference Files

Read these when you need deeper detail:

- **`references/practices-faq-troubleshooting.md`** — Pear's official recommended practices, FAQ answers, and troubleshooting guide (one Corestore/Swarm, teardown cleanup, binary distribution, lock errors, DHT slowness, Bare vs Electron, etc.)
- **`references/pear-annealing.md`** ← **READ FIRST, WRITE LAST** — living knowledge base of real project experience. More reliable than docs for anything previously encountered.
- **`references/desktop-apps.md`** — pear-electron, pear-bridge, pear.gui config, frameless windows, window controls, known Linux issues
- **`references/package-json.md`** — node_modules behavior, ignore patterns, stage.includes, stage.defer, assets, routes, full annotated example, common mistakes
- **`references/staging-and-release.md`** — full staging workflow, key tracking, channel system, rollback, sharing, common confusions
- **`references/patterns.md`** — complete copy-paste scaffolds: minimal desktop, frameless titlebar, P2P desktop, terminal app, two-peer chat, hot updates
- **`references/p2p-stack.md`** — Hypercore, Hyperbee, Hyperdrive, Hyperswarm, HyperDHT, Corestore, Autobase full API reference
- **`references/modules.md`** — pear-electron, pear-updates, pear-run, pear-messages, pear-crasher and other pear-* modules; deprecated API replacements
- **`references/bare-runtime.md`** — Node.js → Bare module equivalents, Bare globals, key differences from Node
