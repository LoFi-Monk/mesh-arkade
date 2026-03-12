# Staging & Release Workflow

> ⚠️ **Docs are stale here.** The official docs show a channel-based syntax that has largely been superseded. This file reflects current behavior.

---

## The Mental Model (Git Analogy)

Think of it like this:

| Pear concept | Git analogy |
|---|---|
| `pear stage <channel>` | `git commit && git push` |
| Channel | Branch name |
| `pear://key` | A specific commit hash / branch HEAD |
| `length` | Commit number (monotonically increasing) |
| `fork` | Branch reset (history was truncated) |
| `pear release` | Tag a version as "production" |
| `pear seed` | Keep the remote alive so others can pull |

A Pear app's full "version" = `key + length + fork`.

---

## First-Time Setup

### 1. Stage to create your key

The **first stage creates the permanent key** for this app+channel combination. The key is derived from: your app name + channel name + your device's corestore key. It **never changes** for this combination.

```bash
pear stage production      # "production" is the channel name (your choice)
```

Output will show something like:
```
staging pear://abc123.../
  added: index.html
  added: index.js
  ...
pear://abc123def456...  ← THIS IS YOUR APP'S KEY
```

**Save this key.** You'll use it to share and run your app.

### 2. Run from your staged key to verify

```bash
pear run pear://abc123def456...
```

### 3. Seed so others can load it

```bash
pear seed production
# or
pear seed pear://abc123def456...
```

### 4. Mark a release

```bash
pear release production
```

---

## The Key/Version System Explained

A `pear://` link can take several forms:

```
pear://abc123...              ← bare key, loads at release pointer (or latest if no release)
pear://0.50.abc123...         ← fork.length.key — exact version snapshot
pear://alias                  ← named alias (e.g. pear://keet)
```

`pear info <channel>` is your primary tool for finding these:

```bash
pear info production          # see current state of a channel
pear info --key production    # just the key
pear info --json production   # machine-readable full info
```

Output includes:
- `key` — the permanent app key
- `length` — current version (number of staged blocks)
- `fork` — how many times history was truncated
- `release` — the length that was marked as production release

---

## Ongoing Dev Workflow

```bash
# Make changes, then:
pear stage production         # pushes new version, increments length

# If you want to share the EXACT current version:
pear info --json production   # get current length
# Full versioned link: pear://fork.length.key
```

---

## Release Workflow

```bash
# Stage until you're happy with a version
pear stage production

# Check what length you're at
pear info production

# Mark current staged version as the production release
pear release production

# Now pear run pear://key loads at the released version
# even if you stage more changes later
```

### Pinning to an exact version

To give someone a link that never changes even if you keep staging:

```bash
pear info --json production    # find current length (e.g. 47)
# Give them: pear://0.47.abc123...
# (fork.length.key format)
```

### Rollback

```bash
# Roll back to a previous length (e.g. 42)
pear release --checkout 42 production

# Verify
pear info production           # release should now show length 42
```

---

## Channel Naming

Channels are just names — you choose them. Common conventions:

```bash
pear stage dev          # work-in-progress
pear stage staging      # QA / testing
pear stage production   # live / public
```

Each channel has its own independent key. The same codebase staged to `dev` and `production` gets **different keys**.

> ⚠️ **Deprecated syntax**: Old docs showed `pear://channel` or `pear stage --channel <name>` style syntax. The current CLI just uses `pear stage <channelName>` directly as positional arg. If you see `pear dev` as a command in old examples, that's outdated — use `pear run --dev .` instead.

---

## Key Tracking Cheatsheet

Use these commands to find your keys and versions at any time:

```bash
# What key does my channel have?
pear info --key production

# Full info (key, length, fork, release)
pear info production

# Machine-readable (best for scripts/agents)
pear info --json production

# List all your installed/known apps
pear data apps --json

# What version is running right now?
# Check Pear.app.key, Pear.app.length, Pear.app.fork inside the app
```

### Inside your running app

```js
const key = Pear.app.key?.toString('hex')   // null if running from disk
const version = `${Pear.app.fork}.${Pear.app.length}.${key}`
const fromDisk = Pear.app.key === null
```

---

## Sharing Your App

Give someone your app's `pear://` key:

```bash
pear info --key production    # copy this key
```

They run it with:
```bash
pear run pear://abc123...
```

Pear fetches the app from peers on the network. They don't need to seed — but the more people seed, the more resilient availability is.

**For you to keep your app available while not running it:**
```bash
pear seed production         # keeps reseeding in the background
```

---

## `pear dump` for Disaster Recovery

If you need to recover your staged files from a key:

```bash
pear dump pear://abc123... ./recovered-files/

# Or just list what's in a staged version
pear dump --list pear://abc123...

# Or dump a specific version
pear dump --checkout 42 pear://abc123... ./recovered-files/
```

---

## Staging Flags Worth Knowing

```bash
pear stage --dry-run production     # see what would be staged without writing
pear stage --json production        # structured output (good for CI/agents)
pear stage --compact production     # tree-shaking — only stages what's imported
                                    # (requires pear.stage.includes for non-JS assets)
pear stage --ignore test/,*.md production  # exclude paths
```

---

## Common Confusions

**"My key changed after re-staging"** — It shouldn't. The key is permanent per channel+device. If it changed, you're either on a different device, changed the app name, or used a different channel name.

**"Peers can't load my app"** — You need to be seeding OR another seeder must be online. Run `pear seed production` and keep it running.

**"How do I know what version a user is running?"** — The versioned link format `pear://fork.length.key` pins an exact version. Or check `Pear.app.length` inside the app at runtime.

**"The docs show `pear dev` as a command"** — That's outdated. Use `pear run --dev .` instead.

**"Should I use channel name or key in `pear release`?"** — Either works once the channel exists: `pear release production` or `pear release pear://abc123...`.