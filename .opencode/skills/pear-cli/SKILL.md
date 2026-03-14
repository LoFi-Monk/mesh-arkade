---
name: pear-cli
description: >
  Complete reference for the Pear CLI — the primary interface for Pear (Holepunch) P2P
  application development. Use this skill whenever the user asks about any `pear` command,
  flags, or workflows: running apps, staging, seeding, releasing, dumping, managing sidecars,
  garbage collection, or any other pear CLI operation. Trigger on mentions of: pear run,
  pear stage, pear seed, pear release, pear init, pear dump, pear info, pear touch,
  pear sidecar, pear versions, pear shift, pear drop, pear gc, pear data, pear://, or
  any question about Pear CLI flags, channels, links, or deployment workflows.
---

# Pear CLI Reference

**stable** — The Command Line Interface is the primary interface for Pear Development.

---

## `pear init [flags] <link|name> [dir]`

Create initial project files.

- **Links:** `pear://electron/template`, `pear://your.key.here/your/path/here`
- **Names:** `default`, `ui`, `node-compat`
- Default project directory is `.`
- Template from a `pear://` link must contain a `_template.json` file defining prompts converted to locals injected into the template.

```
--yes|-y      Autoselect all defaults
--force|-f    Force overwrite existing files
--no-ask      Suppress permissions dialogs
--help|-h     Show help
```

---

## `pear run [flags] <link|dir> [...app-args]`

Run an application from a link or dir.

| Type | Formats |
|------|---------|
| link | `pear://<key>` \| `pear://<alias>` |
| dir  | `file://<absolute-path>` \| `<absolute-path>` \| `<relative-path>` |

```
--dev|-d                    Enable --devtools & --updates-diff
--devtools                  Open devtools with application [Desktop]
--updates-diff              Enable diff computation for Pear.updates
--no-updates                Disable updates firing via Pear.updates
--link=url                  Simulate deep-link click open
--store|-s=path             Set the Application Storage path
--tmp-store|-t              Automatic new tmp folder as store path
--links <kvs>               Override configured links with comma-separated key-values
--chrome-webrtc-internals   Enable chrome://webrtc-internals
--unsafe-clear-app-storage  Clear app storage
--appling=path              Set application shell path
--checkout=n                Run a checkout, n is version length
--checkout=release          Run checkout from marked released length
--checkout=staged           Run checkout from latest version length
--detached                  Wakeup existing app or run detached
--no-ask                    Suppress permissions dialogs
--help|-h                   Show help
```

**Examples:**
```
pear run pear://u6c6it1hhb5serppr3tghdm96j1gprtesygejzhmhnk5xsse8kmy
pear run -s /tmp/app-storage path/to/an-app-folder some --app args
pear run -t file://path/to/an-app-folder --some app --args
pear run pear://keet
```

---

## `pear stage <channel|link> [dir]`

Synchronize local changes to channel or key.

- Channel name must be specified on first stage to generate the initial key.
- The key is unique to the combination of app name, channel name, and device's corestore key — it does not change after first stage.
- Each stage updates the version length, which replicates to connected peers.

```
--dry-run|-d      Execute a stage without writing
--ignore <paths>  Comma-separated path ignore list
--purge           Remove ignored files if present in previous stage
--compact|-c      Tree-shaking minimal stage via static-analysis
--only <paths>    Filter by paths. Comma-separated
--truncate <n>    Advanced. Truncate to version length n
--name <name>     Advanced. Override app name
--no-ask          Suppress permission prompt
--no-pre          Skip pre scripts
--pre-io          Show stdout & stderr of pre scripts
--pre-q           Suppress piped output of pre scripts
--json            Newline delimited JSON output
--help|-h         Show help
```

---

## `pear seed <channel|link> [dir]`

Seed project or reseed key.

Seeding sparsely replicates the application — the full history is available but only the most recent version is typically replicated.

```
--verbose|-v   Additional output
--name <name>  Advanced. Override app name
--no-ask       Suppress permission prompt
--json         Newline delimited JSON output
--help|-h      Show help
```

---

## `pear release <channel|link> [dir]`

Set production release version.

Sets the release pointer against a version (default: latest). Once released, `pear run <link>` loads the app at the released version even if more changes were staged.

```
--checkout=n|current   Set a custom release length (version)
--json                 Newline delimited JSON output
--help|-h              Show help
```

**Release rollbacks** — two approaches:

1. Move the release pointer to a previous length (no file changes, no update diffs):
   ```
   pear release --checkout 500 production
   ```

2. Dump files from the previous version, then stage + re-release (heavier, but shows update diffs — fits the dump-stage-release strategy).

---

## `pear info [link|channel]`

Read project information. Supply a link or channel for app info; no argument for platform info.

```
--metadata   View metadata only
--manifest   View app manifest only
--key        View key only
--no-ask     Suppress permission prompt
--json       Newline delimited JSON output
--help|-h    Show help
```

---

## `pear dump [flags] <link> <dir>`

Synchronize files from link to dir. Use `-` in place of `<dir>` to dump to stdout.

The link can include a path to dump a subset of files:
```
pear dump pear://keet/CHANGELOG.md dump-dir/
```

```
--dry-run|-d    Execute a dump without writing
--checkout <n>  Dump from specified checkout, n is version length
--only <paths>  Filter by paths. Implies --no-prune. Comma-separated
--force|-f      Force overwrite existing files
--list          List paths at link. Sets <dir> to -
--no-ask        Suppress permission prompt
--no-prune      Prevent removal of existing paths
--json          Newline delimited JSON output
--help|-h       Show help
```

---

## `pear touch [flags] [channel]`

Create a Pear link using a channel name (or randomly generated if omitted). Useful for creating links for automations with `pear stage <link>`, `pear release <link>`, or `pear seed <link>`.

```
--json      Newline delimited JSON output
--help|-h   Show help
```

---

## `pear sidecar`

The Pear Sidecar is a local-running HTTP and IPC server providing access to corestores. This command shuts down any existing sidecar process and becomes the sidecar.

```
--mem                 Memory mode: RAM corestore
--key <key>           Advanced. Switch release lines
--log-level <level>   Level to log at: 0,1,2,3 (OFF,ERR,INF,TRC)
--log-labels <list>   Labels to log (internal, always logged)
--log-fields <list>   Show/hide: date,time,h:level,h:label,h:delta
--log-stacks          Add a stack trace to each log message
--help|-h             Show help
```

---

## `pear versions`

Output version information.

```
--modules|-m   Include module versions
--json         Single JSON object
--help|-h      Show help
```

---

## `pear shift [flags] <source> <destination>`

Move user application storage between applications. `<source>` and `<destination>` are links.

```
--force     Overwrite existing application storage if present
--json      Newline delimited JSON output
--help|-h   Show help
```

---

## `pear drop [flags] [command]`

**Advanced. Permanent data deletion.** Confirmation is required — storage is deleted permanently and cannot be recovered.

| Command | Description |
|---------|-------------|
| `app`   | Reset an application to initial state |

```
--json      Newline delimited JSON output
--help|-h   Show help
```

---

## `pear gc [flags] [command]`

Perform garbage collection and remove unused resources.

| Command    | Description             |
|------------|-------------------------|
| `releases` | Clear inactive releases |
| `sidecars` | Clear running sidecars  |
| `assets`   | Clear synced assets     |
| `cores`    | Corestore cores         |

```
--json      Newline delimited JSON output
--help|-h   Show help
```

---

## `pear data [flags] [command]`

View database contents. The database contains metadata stored on this device used by the Pear runtime.

| Command    | Description                  |
|------------|------------------------------|
| `apps`     | Installed apps               |
| `dht`      | DHT known-nodes cache        |
| `gc`       | Garbage collection records   |
| `manifest` | Database internal versioning |
| `assets`   | On-disk assets for app       |
| `currents` | Current working versions     |

```
--secrets   Show sensitive information, i.e. encryption-keys
--json      Newline delimited JSON output
--help|-h   Show help
```
