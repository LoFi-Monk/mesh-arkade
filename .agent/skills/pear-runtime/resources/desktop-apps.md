# Desktop App Reference (pear-electron)

> ⚠️ **Docs vs Reality**: The official docs are significantly behind. This file is sourced from the GitHub READMEs for `pear-electron` and `pear-bridge`, plus open issues. Prefer this over docs.pears.com for desktop apps.

---

## The Three Files You Always Need

```
my-app/
├── package.json      ← pear config + pear.gui + pear.pre
├── index.js          ← app entrypoint (Runtime + Bridge setup)
└── index.html        ← UI entry (imports ui from 'pear-electron')
```

---

## `package.json` for a Desktop App

```json
{
  "name": "my-app",
  "main": "index.js",
  "pear": {
    "name": "my-app",
    "pre": "pear-electron/pre",
    "gui": {
      "width": 1200,
      "height": 800,
      "backgroundColor": "#1a1a2e",
      "transparent": false,
      "frame": true
    }
  }
}
```

**Critical:** `"pre": "pear-electron/pre"` is required. Without it, the runtime won't load correctly. The pre script automatically adds the Electron runtime as a pear.asset and adds script entrypoints for static analysis.

---

## `pear.gui` Configuration Options

All of these go inside `"pear": { "gui": { ... } }` in `package.json`.

| Option | Type | Description |
|---|---|---|
| `width` | Number | Window width (pixels) |
| `height` | Number | Window height (pixels) |
| `x` | Number | Horizontal position (pixels) |
| `y` | Number | Vertical position (pixels) |
| `minWidth` | Number | Minimum width |
| `minHeight` | Number | Minimum height |
| `maxWidth` | Number | Maximum width |
| `maxHeight` | Number | Maximum height |
| `center` | Boolean | Center window on screen |
| `resizable` | Boolean | Window resizability |
| `movable` | Boolean | Window movability |
| `minimizable` | Boolean | Window minimizability |
| `maximizable` | Boolean | Window maximizability |
| `closable` | Boolean | Window closability |
| `focusable` | Boolean | Window focusability |
| `alwaysOnTop` | Boolean | Always on top |
| `fullscreen` | Boolean | Start fullscreen |
| `kiosk` | Boolean | Start in kiosk mode (⚠️ can crash on Linux) |
| `autoHideMenuBar` | Boolean | Hide menu bar unless Alt pressed (Linux/Windows) |
| `hasShadow` | Boolean | Window shadow |
| `opacity` | Number | Opacity 0.0–1.0 (requires `transparent: true`) |
| `transparent` | Boolean | Enable transparency (required for opacity) |
| `backgroundColor` | String | Hex/RGB/RGBA/HSL/CSS color |
| `frame` | Boolean | Show OS frame/titlebar (default: true) |

### ⚠️ Known Linux Issues (issue #35)
Several `pear.gui` options **do not work on some Linux desktop environments** (confirmed on Linux Mint/Xfce):
- `center`, `maximizable`, `movable`, `minimizable`, `closable`
- `alwaysOnTop`, `autoHideMenuBar`, `hasShadow`, `opacity`, `transparent`, `backgroundColor`
- `kiosk` crashes instantly on Linux

If these are critical, test on target OS early.

---

## App Entrypoint (`index.js`)

```js
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'

const runtime = new Runtime()
await runtime.ready()          // bootstraps runtime binaries if needed

const server = new Bridge({
  mount: '/',                  // base path for file serving
  // waypoint: '/index.html',  // catch-all for SPA routing
})
await server.ready()

const pipe = runtime.start({ info: server.info() })
Pear.teardown(() => pipe.end())
```

> ⚠️ **API change**: The `pear-bridge` README now shows `server.info()` (not `{ bridge }` as older docs/examples show). Use `runtime.start({ info: server.info() })`.

### `pear-bridge` Options

```js
new Bridge({
  mount: '/ui',          // mount path — URL /foo → serve from /ui/foo
  waypoint: '/index.html', // catch-all for unmatched paths (enables SPA routing)
  bypass: ['/node_modules'] // advanced: mount bypass for dep discovery (default)
})
```

---

## UI API (`import ui from 'pear-electron'` in HTML context)

Inside HTML scripts, `pear-electron` resolves to the UI control API.

```html
<script type="module" src="./app.js"></script>
```

```js
// app.js (runs in the browser/renderer context)
import ui from 'pear-electron'
```

> ⚠️ Use `<script type="module">` for ESM. `require()` does NOT work in the renderer — this is a browser context.

### `ui.app` — Current Window/View Controls

```js
await ui.app.focus({ steal: true })  // foreground window (steal: also focus input)
await ui.app.blur()                  // blur
await ui.app.show()                  // show
await ui.app.hide()                  // hide
await ui.app.minimize()              // minimize
await ui.app.maximize()              // maximize
await ui.app.restore()               // unmaximize/unminimize
await ui.app.close()                 // close view or window
await ui.app.getSourceId()           // get sourceId for screen capture

ui.app.visible                       // Boolean — is window visible?
```

### `ui.app.badge(count)` — macOS/Linux app badge

```js
await ui.app.badge(5)    // set badge to 5
await ui.app.badge(0)    // hide badge
await ui.app.badge(null) // plain dot (macOS only)
```

### `ui.app.tray(options, listener)` — System tray

```js
const untray = await ui.app.tray({
  icon: './icon.png',         // path to icon
  title: 'My App',           // tray title (macOS)
  tooltip: 'My App',         // tooltip text
  menu: [
    { label: 'Open', key: 'open' },
    { type: 'separator' },
    { label: 'Quit', key: 'quit' }
  ]
}, (key) => {
  if (key === 'open') ui.app.show()
  if (key === 'quit') Pear.exit(0)
  if (key === 'click') ui.app.show() // tray icon itself was clicked
})

// Remove tray
await untray()
```

### `ui.media` — Screen/Audio Capture

```js
const sources = await ui.media.desktopSources({
  types: ['screen', 'window'],
  thumbnailSize: { width: 150, height: 150 }
})
// sources = [{ id, name, thumbnail, display_id, appIcon }]
```

---

## Frameless / Custom Titlebar

If you want a custom titlebar (common for branded apps), use `"frame": false` in `pear.gui`:

```json
{
  "pear": {
    "gui": { "frame": false }
  }
}
```

Then in your CSS, mark the drag region and make controls non-draggable:

```css
/* Make titlebar area draggable */
.titlebar {
  -webkit-app-region: drag;
  -webkit-user-select: none;  /* prevent text selection while dragging */
  height: 32px;
}

/* Buttons must NOT be draggable */
.titlebar-controls {
  -webkit-app-region: no-drag;
}
```

Then wire up your custom minimize/maximize/close buttons to the `ui.app` methods:

```js
import ui from 'pear-electron'

document.getElementById('btn-minimize').onclick = () => ui.app.minimize()
document.getElementById('btn-maximize').onclick = () => ui.app.maximize()
document.getElementById('btn-close').onclick = () => ui.app.close()
```

### macOS traffic lights with hidden titlebar

For macOS-style hidden titlebar with native traffic light buttons:
Set `"titleBarStyle": "hiddenInset"` — but note this is an **Electron** option not directly exposed in `pear.gui`. You may need a custom `pre` script to inject this, or check if the current version of `pear-electron` exposes it.

> ⚠️ If your frameless window can't be dragged: ensure `-webkit-app-region: drag` is on the titlebar element AND the devtools are closed (dragging breaks with devtools open — known Electron issue).

---

## SPA Routing in Desktop Apps

For single-page apps where all routes should load `index.html`:

```json
{
  "pear": {
    "routes": ".",
    "pre": "pear-electron/pre"
  }
}
```

And in `pear-bridge`:
```js
new Bridge({ waypoint: '/index.html' })
```

---

## Scavenger Hunt Tips

When something doesn't work with desktop app setup, check these in order:

1. **`pear-electron` GitHub README** — https://github.com/holepunchto/pear-electron — most accurate API
2. **`pear-bridge` GitHub README** — https://github.com/holepunchto/pear-bridge — bridge API (note: `server.info()` not `{ bridge }`)
3. **Open issues on pear-electron** — https://github.com/holepunchto/pear-electron/issues — known bugs
4. **Open issues on pear** — https://github.com/holepunchto/pear/issues — platform-level bugs

Common failure points:
- Missing `"pre": "pear-electron/pre"` in `package.json` → runtime never loads
- Using old `runtime.start({ bridge })` instead of `runtime.start({ info: server.info() })`
- Using `require()` in renderer (HTML) context → use ESM `import` and `<script type="module">`
- `-webkit-app-region: drag` on a parent and forgetting `no-drag` on buttons inside it
- `window.open()` opens system browser, not a new app window — use `Pear.Window` instead (if available in your version)