---
name: obsidian-cli
description: Use when collaborating live with the user in Obsidian. Control Obsidian from the terminal — file ops, search, tasks, plugins, dev tools, and more.
---

# Obsidian CLI Skill

Control Obsidian programmatically from the command line for scripting, automation, and agentic workflows.

> [!IMPORTANT]
> **When interacting with Obsidian vault content, always use CLI commands — not filesystem tools.**
> - Read notes with `obsidian read`, not `view_file`.
> - Write/modify notes with `obsidian append`, `obsidian prepend`, or `obsidian create`, not file editing tools.
> - Search notes with `obsidian search`, not `grep_search`.
> - The CLI operates on the live vault and respects Obsidian's link resolution, templates, and plugins — filesystem tools bypass all of that.

> **Source:** <https://help.obsidian.md/cli>

## Prerequisites

- **Obsidian 1.12+ installer** must be installed.
- **Obsidian app must be running.** The CLI communicates with the running app. If Obsidian is not open, the CLI will not respond.
- On **Windows**, you need the `.com` redirector (`Obsidian.com`) — see `resources/troubleshooting.md`.

## Preflight Check

Run these commands before doing any real work to confirm the CLI is operational:

```shell
obsidian version        # confirm CLI is responding
obsidian vault          # get vault info + absolute path
obsidian file           # confirm active file access
```

> **If the CLI hangs or returns nothing:** Tell the user to open Obsidian on their desktop. The CLI requires the Obsidian desktop app to be actively running — it is not a standalone tool.

## Usage Modes

### Single command
```shell
obsidian <command> [params] [flags]
```

### Interactive TUI
```shell
obsidian        # opens TUI, then type commands without the `obsidian` prefix
```
The TUI supports autocomplete, history, and reverse search (`Ctrl+R`).

## Core Syntax

### Parameters & Flags
- **Parameter**: `key=value` — quote values with spaces: `key="multi word value"`
- **Flag**: bare keyword (boolean toggle) — e.g. `open`, `overwrite`, `total`
- **Multiline**: use `\n` for newlines, `\t` for tabs
- **Copy output**: append `--copy` to any command (may not work on all versions — verify first)

### Targeting a Vault
```shell
obsidian vault=Notes daily              # by name
obsidian vault="My Vault" search query="test"
```
If CWD is inside a vault, that vault is used automatically.

### Targeting a File
- `file=<name>` — wikilink-style resolution (basename, no extension needed)
- `path=<path>` — exact path from vault root, e.g. `folder/note.md`
- If neither is provided, the **active file** is used.

## Command Quick Reference

| Category | Key Commands | Resource |
|---|---|---|
| General | `help`, `version`, `reload`, `restart` | `resources/general.md` |
| Files & Folders | `create`, `read`, `append`, `prepend`, `move`, `rename`, `delete`, `open`, `files`, `folders` | `resources/files-and-folders.md` |
| Daily Notes | `daily`, `daily:read`, `daily:append`, `daily:prepend`, `daily:path` | `resources/daily-notes.md` |
| Search | `search`, `search:context`, `search:open` | `resources/search.md` |
| Properties & Tags | `properties`, `property:set`, `property:remove`, `tags`, `tag`, `aliases` | `resources/properties-and-tags.md` |
| Tasks | `tasks`, `task` (show/toggle/done/todo) | `resources/tasks.md` |
| Links | `backlinks`, `links`, `unresolved`, `orphans`, `deadends` | `resources/links.md` |
| Plugins & Themes | `plugins`, `plugin:install`, `plugin:reload`, `themes`, `snippets` | `resources/plugins-and-themes.md` |
| Sync & Publish | `sync`, `sync:status`, `sync:history`, `publish:add`, `publish:status` | `resources/sync-and-publish.md` |
| Bases | `bases`, `base:create`, `base:query` | `resources/bases.md` |
| Bookmarks | `bookmarks`, `bookmark` | `resources/bookmarks.md` |
| File History | `diff`, `history`, `history:read`, `history:restore` | `resources/files-and-folders.md` |
| Developer | `devtools`, `eval`, `dev:screenshot`, `dev:dom`, `dev:css`, `dev:console`, `dev:errors` | `resources/developer.md` |
| Workspace | `workspace`, `tabs`, `recents`, `workspaces` | `resources/workspace.md` |
| Templates | `templates`, `template:read`, `template:insert` | `resources/files-and-folders.md` |
| Shortcuts | TUI keyboard shortcuts | `resources/keyboard-shortcuts.md` |
| Troubleshooting | Platform-specific setup (Win/Mac/Linux) | `resources/troubleshooting.md` |

## Common Agentic Patterns

### Read → Modify → Verify
```shell
obsidian read file=MyNote
obsidian append file=MyNote content="New section"
obsidian read file=MyNote   # verify
```

### Create from Template
```shell
obsidian create name="Meeting 2026-03-04" template=Meeting open
```

### Search & Inspect
```shell
obsidian search:context query="TODO" limit=10
obsidian tasks todo verbose
```

### Developer / Debug
```shell
obsidian eval code="app.vault.getFiles().length"
obsidian dev:screenshot path=screenshot.png
obsidian plugin:reload id=my-plugin
obsidian dev:errors
obsidian dev:console level=error limit=20
```

## Agent Notes & Known Issues

### Windows: stdout may hang or be swallowed
On Windows, if the updated installer (1.12.4+) is not present, `Obsidian.exe` is a GUI app that does not cleanly pipe stdout back to the terminal. `obsidian file` (short output) may work, but `obsidian read` (large output) can hang indefinitely.

**Workaround:** Pipe output to a file and read it:
```shell
obsidian read | Out-File -FilePath temp.txt
# then read temp.txt with view_file
```

**Permanent fix:** User needs to download the latest installer from https://obsidian.md/download which adds `Obsidian.com` (a console-mode redirector).

### CLI not responding at all
If the CLI returns nothing or hangs on every command (including `obsidian version`), **ask the user to open Obsidian on their desktop**. The CLI is not a standalone tool — it communicates with the running Obsidian app via IPC. No app running = no CLI.

### `obsidian file` is always reliable
Even when `obsidian read` has trouble on Windows, `obsidian file` consistently returns the active file's metadata (path, name, size). Use it as a fallback to at least identify which file is open.

### Stay in the CLI
Always prefer CLI commands (`obsidian read`, `obsidian append`, `obsidian search`, etc.) over resolving filesystem paths and using agent file tools. The CLI is the interface — treat it as the primary way to interact with vault content.

### Plugin code blocks in output
`obsidian read` returns raw markdown, which may include plugin-specific fenced code blocks such as ` ```cardlink `, ` ```dataview `, ` ```tasks `, etc. These are **not corrupted output** — they are valid markdown that Obsidian plugins render visually (e.g. URL preview cards, query results). Treat them as normal note content.

