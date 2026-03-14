# package.json Configuration Reference

Everything that goes in the `"pear"` field of `package.json`, plus how Pear handles `node_modules`, file staging, and assets.

---

## How `node_modules` Works in Pear

> This trips up almost everyone coming from a traditional web/Node background.

**`node_modules` are NOT staged.** Pear never stages your `node_modules` folder. Instead:

- Dependencies are listed in `package.json` as normal (`"dependencies": { ... }`)
- Each user/device runs `npm install` themselves after getting the app
- When someone does `pear run pear://yourkey`, they get your app files — then their runtime resolves modules from their local `node_modules`

**Why?** Because `node_modules` can be hundreds of MB, platform-specific (native addons), and Pear apps are meant to be lightweight P2P-distributed bundles.

**What this means in practice:**
- You must have `node_modules` in your `.gitignore` AND effectively ignored from staging
- `node_modules` is automatically excluded from staging — you don't need to add it to `stage.ignore`
- Users of your app need npm/node to install deps, OR you need to bundle your app (see below)

**If you use native addons (`.node` files):** These are platform-specific and won't work when replicated to a different OS. Handle with `pear.assets` or document that users must `npm install` on their platform.

---

## Minimal Valid `package.json`

```json
{
  "name": "my-app",
  "main": "index.html",
  "pear": {}
}
```

- `name` — required. Lowercase, one word. Letters, numbers, `-`, `_`, `/`, `@` allowed.
- `main` — entry file. Defaults to `index.html` (desktop) or `index.js` (terminal) if omitted.
- `pear` object — required but can be empty `{}`.
- **No `version` field needed** — Pear versioning is automatic. Any `version` field is ignored.

---

## Full `package.json` Example

```json
{
  "name": "my-p2p-app",
  "main": "index.js",
  "type": "module",
  "pear": {
    "name": "my-p2p-app",
    "pre": "pear-electron/pre",
    "gui": {
      "width": 1200,
      "height": 800,
      "minWidth": 600,
      "minHeight": 400,
      "backgroundColor": "#1a1a2e",
      "frame": true,
      "transparent": false
    },
    "stage": {
      "entrypoints": ["./worker.js", "./preload.js"],
      "ignore": ["test/", "*.test.js", ".env", "*.md", "scripts/"],
      "includes": ["assets/icons/", "assets/sounds/", "wasm/module.wasm"],
      "defer": ["optional-package", "peer-only-dep"]
    },
    "routes": ".",
    "links": {
      "backend": "pear://abc123...",
      "api": "https://trusted-api.example.com"
    }
  },
  "dependencies": {
    "pear-electron": "latest",
    "pear-bridge": "latest",
    "hyperswarm": "^4.0.0",
    "hyperbee": "^2.0.0",
    "corestore": "^6.0.0"
  }
}
```

---

## `pear.stage.ignore` — Excluding Files

Files and directories to exclude from `pear stage`. These never get staged to the P2P drive.

```json
{
  "pear": {
    "stage": {
      "ignore": [
        "test/",
        "tests/",
        "*.test.js",
        "*.spec.js",
        ".env",
        ".env.*",
        "*.md",
        "README*",
        ".git/",
        ".github/",
        "scripts/",
        "docs/",
        ".DS_Store",
        "*.log"
      ]
    }
  }
}
```

**Rules:**
- Paths are relative to `package.json`
- Trailing `/` matches a directory and everything inside it
- Glob patterns (`*.test.js`) are supported
- `node_modules/` is automatically excluded — you don't need to add it
- `.git/` is NOT automatically excluded — add it explicitly if you want

**You can also ignore per-run from the CLI:**
```bash
pear stage --ignore test/,*.md production
```

---

## `pear.stage.includes` — Force-Including Files

By default, `pear stage --compact` uses static analysis to find what files to include (by tracing `import`/`require` chains). Files that aren't reachable through imports are excluded.

Use `stage.includes` to force-include files that static analysis misses:

```json
{
  "pear": {
    "stage": {
      "includes": [
        "assets/",
        "assets/icons/",
        "assets/sounds/notification.mp3",
        "wasm/",
        "locales/",
        "data/seed-data.json"
      ]
    }
  }
}
```

**When you need this:**
- Image, audio, video files (not JS, so not found by static analysis)
- WASM modules
- JSON data files loaded with `fetch()` or `fs.readFile()` at runtime
- Files loaded via dynamic `require(variable)` or `import(variable)`
- Locale/i18n files
- Anything referenced by string path at runtime rather than statically imported

**You only need `stage.includes` with `pear stage --compact`.** Without `--compact`, all files (except ignored ones) are staged. With `--compact`, only statically reachable JS + your `includes` list are staged.

---

## `pear.stage.entrypoints` — Extra Analysis Roots

Tell the static analyzer to start from additional JS files, beyond your `main` entrypoint:

```json
{
  "pear": {
    "stage": {
      "entrypoints": [
        "./worker.js",
        "./preload.js",
        "./background.js"
      ]
    }
  }
}
```

**When you need this:**
- Web workers spawned at runtime
- Electron preload scripts
- Any JS file that's loaded dynamically by path (not imported)
- Scripts injected via `<script src="...">` tags not in your main HTML

---

## `pear.stage.defer` — Skip Optional Dependencies

Some packages use the pattern `try { require('optional-dep') } catch {}`. During `pear stage --compact`, the static analyzer tries to resolve every `require`/`import` it finds. If an optional dep isn't installed, it errors and retries, which slows staging significantly.

Add these to `defer` to tell the analyzer to skip them:

```json
{
  "pear": {
    "stage": {
      "defer": [
        "fsevents",
        "better-sqlite3",
        "some-optional-native-addon"
      ]
    }
  }
}
```

**How to find what needs deferring:** Run `pear stage --compact` and watch for "skip hint" messages in the output. Add whatever specifiers it suggests.

---

## `pear.pre` — Pre-Run Script

A script that runs before `pear run ./` (from disk) and before `pear stage`, but **NOT** before `pear run pear://key` (from network):

```json
{
  "pear": {
    "pre": "pear-electron/pre"
  }
}
```

For desktop apps, **always set this to `"pear-electron/pre"`**. It bootstraps the Electron runtime assets automatically.

For custom pre scripts:
```json
{
  "pear": {
    "pre": "./scripts/pre.js"
  }
}
```

A custom pre script receives app config via `pear-pipe` and can mutate it before the app starts. See `pear-pipe` docs for the protocol.

---

## `pear.routes` — URL Routing

Controls how `pear://key/pathname` links are handled:

```json
{ "pear": { "routes": "." } }
```

`"."` means: redirect all pathnames to the main entrypoint. **Required for SPAs.** Without this, `pear run pear://key/some/path` would try to load `some/path.js` as a separate entrypoint.

Custom route mapping:
```json
{
  "pear": {
    "routes": {
      "/old": "/new",
      "/v1/api": "/api/v2/index.js"
    }
  }
}
```

---

## `pear.assets` — External Binary/Bundle Assets

For assets that are too large or platform-specific to stage with your app (like an Electron UI bundle, WASM runtime, native binaries, or LLM weights):

```json
{
  "pear": {
    "assets": {
      "ui": {
        "link": "pear://0.940.abc123...",
        "name": "My UI Runtime",
        "only": [
          "/boot.bundle",
          "/by-arch/%%HOST%%",
          "/prebuilds/%%HOST%%"
        ]
      }
    }
  }
}
```

- `link` — full versioned `pear://fork.length.key` link (required)
- `name` — optional, used by `pear-electron` for binary naming
- `only` — optional array of paths to fetch. `%%HOST%%` expands to `linux-x64`, `darwin-arm64`, etc.

Assets are fetched on first `pear run` and updated passively while the app runs.

Access at runtime: `Pear.app.assets['ui'].path`

**When to use `pear.assets` vs `pear.stage.includes`:**
- `stage.includes` — for small files (images, JSON, WASM) that belong with your app source
- `pear.assets` — for large, versioned, platform-specific binaries that live in their own Pear drive

---

## `pear.gui` — Desktop Window Config

See `references/desktop-apps.md` for the full table. Summary of commonly used options:

```json
{
  "pear": {
    "gui": {
      "width": 1024,
      "height": 768,
      "minWidth": 400,
      "minHeight": 300,
      "backgroundColor": "#ffffff",
      "frame": true,
      "transparent": false,
      "resizable": true,
      "center": true
    }
  }
}
```

---

## `pear.links` — Trusted Links

Declare trusted `pear://` or `https://` links. Exposed as `Pear.app.links` at runtime:

```json
{
  "pear": {
    "links": {
      "backend": "pear://abc123...",
      "docs": "https://my-docs.example.com"
    }
  }
}
```

---

## Common `package.json` Mistakes

**Wrong: versioning your app manually**
```json
{ "version": "1.0.0" }   ← ignored by Pear, don't bother
```

**Wrong: expecting node_modules to be staged**
```
Users must npm install — document this, or bundle your app.
```

**Wrong: `"type": "module"` missing with ESM imports**
```json
{ "type": "module" }   ← add this if you use import/export
```

**Wrong: `main` pointing to HTML for a terminal app**
```json
{ "main": "index.html" }   ← terminal apps need a .js entrypoint
```

**Wrong: using `frameless` in `pear.gui`**
```json
{ "gui": { "frameless": true } }   ← old/wrong. Use "frame": false
```
