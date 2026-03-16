---
name: obsidian-cli
description: >
  Complete reference for the Obsidian CLI — the command-line interface for Obsidian vaults.
  Use this skill whenever the user asks about any `obsidian` command, flags, or workflows:
  reading/writing notes, appending to daily notes, searching the vault, managing properties,
  tasks, plugins, themes, sync, publish, file operations, or any other Obsidian CLI operation.
  Trigger on mentions of: obsidian read, obsidian create, obsidian append, obsidian search,
  obsidian daily, obsidian tasks, obsidian tags, obsidian properties, obsidian eval,
  or any question about Obsidian CLI flags, vault targeting, or automation workflows.
---

# Obsidian CLI Reference

Source: https://help.obsidian.md/cli

Obsidian CLI lets you control Obsidian from your terminal for scripting, automation, and integration with external tools. Anything you can do in Obsidian you can do from the command line.

**Requires Obsidian 1.12+ installer (Early Access). The Obsidian app must be running.**

---

## Install

1. Go to **Settings → General**
2. Enable **Command line interface**
3. Follow the prompt to register the CLI
4. Restart your terminal

---

## Usage

```shell
# Single command
obsidian <command> [params] [flags]

# TUI mode (interactive, with autocomplete + history)
obsidian
```

In TUI mode, subsequent commands can be entered without `obsidian` prefix.

---

## Global Options

```bash
vault=<name>    # Target a specific vault by name (must come FIRST)
--copy          # Copy output to clipboard (works with any command)
```

**Vault targeting:**
```shell
obsidian vault=Notes daily
obsidian vault="My Vault" search query="test"
```

If the terminal's CWD is a vault folder, that vault is used by default. Otherwise, the active vault is used.

**File targeting:**
- `file=<name>` — resolves by name like wikilinks (no path/extension needed)
- `path=<path>` — exact path from vault root (e.g. `folder/note.md`)
- Most commands default to the active file when omitted

**Parameter syntax:**
- Parameters: `key=value`, quoted if spaces: `name="My Note"`
- Flags: boolean switches, include to enable (e.g. `open`, `overwrite`)
- Multiline: use `\n` for newline, `\t` for tab in content values

---

## General

```bash
obsidian help [<command>]    # list all commands or help for specific command
obsidian version             # show Obsidian version
obsidian reload              # reload the app window
obsidian restart             # restart the app
```

---

## Files and Folders

### read
Read file contents (default: active file).
```bash
file=<name>
path=<path>
```

### create
Create or overwrite a file.
```bash
name=<name>        # file name
path=<path>        # file path
content=<text>     # initial content
template=<name>    # template to use
overwrite          # overwrite if file exists
open               # open file after creating
newtab             # open in new tab
```

### append
Append content to a file (default: active file).
```bash
file=<name>
path=<path>
content=<text>     # (required)
inline             # append without newline
```

### prepend
Prepend content **after frontmatter** (default: active file).
```bash
file=<name>
path=<path>
content=<text>     # (required)
inline             # prepend without newline
```

### move
Move or rename a file. Automatically updates internal links if enabled in vault settings.
```bash
file=<name>
path=<path>
to=<path>          # (required) destination folder or path
```

### rename
Rename a file. Extension is preserved if omitted. Updates internal links.
```bash
file=<name>
path=<path>
name=<name>        # (required) new file name
```

### delete
Delete a file (default: active file, goes to trash).
```bash
file=<name>
path=<path>
permanent          # skip trash, delete permanently
```

### open
Open a file.
```bash
file=<name>
path=<path>
newtab
```

### file
Show file info (path, name, extension, size, created, modified).
```bash
file=<name>
path=<path>
```

### files
List files in the vault.
```bash
folder=<path>      # filter by folder
ext=<extension>    # filter by extension
total              # return file count
```

### folder / folders
```bash
# folder - show folder info
path=<path>              # (required)
info=files|folders|size

# folders - list folders
folder=<path>            # filter by parent folder
total
```

### recents
```bash
total
```

---

## Daily Notes

```bash
obsidian daily                              # open today's daily note
obsidian daily:read                         # read daily note contents
obsidian daily:path                         # get path (even if not yet created)
obsidian daily:append content="- [ ] Task" # append to daily note
obsidian daily:prepend content="## Morning" # prepend to daily note
```

```bash
# daily, daily:append, daily:prepend all support:
paneType=tab|split|window
open
inline   # (append/prepend only) without newline
```

---

## Search

### search
Returns matching file paths.
```bash
query=<text>       # (required)
path=<folder>      # limit to folder
limit=<n>
total
case               # case sensitive
format=text|json
```

### search:context
Returns grep-style `path:line: text` output.
```bash
query=<text>       # (required)
path=<folder>
limit=<n>
case
format=text|json
```

### search:open
```bash
query=<text>       # initial search query
```

---

## Tags

```bash
# tags - list all tags
file=<name>
path=<path>
sort=count         # default: name
total
counts
format=json|tsv|csv
active

# tag - get tag info
name=<tag>         # (required)
total
verbose            # include file list and count
```

---

## Links & Graph

```bash
obsidian links [file=<name>] [total]
obsidian backlinks [file=<name>] [counts] [total] [format=json|tsv|csv]
obsidian orphans [total] [all]         # files with no incoming links
obsidian deadends [total] [all]        # files with no outgoing links
obsidian unresolved [total] [counts] [verbose] [format=json|tsv|csv]
obsidian aliases [file=<name>] [total] [verbose] [active]
```

---

## Properties & Metadata

```bash
# properties - list properties in vault (or for a file)
file=<name>
path=<path>
name=<name>        # get specific property count
sort=count
total
counts
format=yaml|json|tsv
active

# property:read
name=<name>        # (required)
file=<name>
path=<path>

# property:set
name=<name>        # (required)
value=<value>      # (required)
type=text|list|number|checkbox|date|datetime
file=<name>
path=<path>

# property:remove
name=<name>        # (required)
file=<name>
path=<path>
```

---

## Tasks

### tasks
```bash
file=<name>
path=<path>
status="<char>"    # filter by status character (quote special chars)
total
done
todo
verbose            # group by file with line numbers
format=json|tsv|csv
active
daily
```

**Examples:**
```shell
obsidian tasks todo
obsidian tasks daily
obsidian tasks file=Recipe done
obsidian tasks verbose
obsidian tasks 'status=?'
```

### task
Show or update a specific task.
```bash
ref=<path:line>    # e.g. "Recipe.md:8"
file=<name>
path=<path>
line=<n>
status="<char>"
toggle
daily
done
todo
```

**Examples:**
```shell
obsidian task ref="Recipe.md:8" toggle
obsidian task file=Recipe line=8 done    # → [x]
obsidian task file=Recipe line=8 todo    # → [ ]
obsidian task file=Recipe line=8 status=-  # → [-]
obsidian task daily line=3 done
```

---

## Templates

```bash
obsidian templates [total]

obsidian template:read name=<template> [resolve] [title=<title>]
# resolve: processes {{date}}, {{time}}, {{title}} variables

obsidian template:insert name=<template>
# inserts into active file
```

---

## Outline & Word Count

```bash
obsidian outline [file=<name>] [format=tree|md|json] [total]
obsidian wordcount [file=<name>] [words] [characters]
```

---

## Unique Notes

```bash
obsidian unique [name=<text>] [content=<text>] [paneType=tab|split|window] [open]
```

---

## Random Notes

```bash
obsidian random [folder=<path>] [newtab]
obsidian random:read [folder=<path>]
```

---

## Plugins

```bash
obsidian plugins [filter=core|community] [versions] [format=json|tsv|csv]
obsidian plugins:enabled [filter=core|community] [versions] [format=json|tsv|csv]
obsidian plugins:restrict [on|off]
obsidian plugin id=<id>
obsidian plugin:enable id=<id> [filter=core|community]
obsidian plugin:disable id=<id> [filter=core|community]
obsidian plugin:install id=<id> [enable]
obsidian plugin:uninstall id=<id>
obsidian plugin:reload id=<id>    # for developers
```

---

## Themes & Snippets

```bash
obsidian themes [versions]
obsidian theme [name=<name>]
obsidian theme:set name=<name>
obsidian theme:install name=<name> [enable]
obsidian theme:uninstall name=<name>

obsidian snippets
obsidian snippets:enabled
obsidian snippet:enable name=<name>
obsidian snippet:disable name=<name>
```

---

## Bookmarks

```bash
obsidian bookmarks [total] [verbose] [format=json|tsv|csv]
obsidian bookmark [file=<path>] [subpath=<subpath>] [folder=<path>] [search=<query>] [url=<url>] [title=<title>]
```

---

## Command Palette & Hotkeys

```bash
obsidian commands [filter=<prefix>]
obsidian command id=<command-id>    # execute any Obsidian command
obsidian hotkeys [total] [verbose] [format=json|tsv|csv] [all]
obsidian hotkey id=<command-id> [verbose]
```

---

## Sync

```bash
obsidian sync:status
obsidian sync [on|off]             # resume or pause
obsidian sync:history [file=<name>] [total]
obsidian sync:read file=<name> version=<n>
obsidian sync:restore file=<name> version=<n>
obsidian sync:open [file=<name>]
obsidian sync:deleted [total]
```

> To sync without the desktop app running, see [Obsidian Headless](https://help.obsidian.md/headless).

---

## File History (File Recovery)

```bash
obsidian diff [file=<name>] [from=<n>] [to=<n>] [filter=local|sync]
# versions numbered newest→oldest

obsidian history [file=<name>]
obsidian history:list
obsidian history:read [file=<name>] [version=<n>]     # default: version 1
obsidian history:restore file=<name> version=<n>
obsidian history:open [file=<name>]
```

---

## Publish

```bash
obsidian publish:site
obsidian publish:list [total]
obsidian publish:status [total] [new] [changed] [deleted]
obsidian publish:add [file=<name>] [changed]    # publish file or all changed
obsidian publish:remove [file=<name>]
obsidian publish:open [file=<name>]
```

---

## Vault

```bash
obsidian vault [info=name|path|files|folders|size]
obsidian vaults [total] [verbose]
obsidian vault:open name=<name>    # TUI only — switch vault
```

---

## Workspace

```bash
obsidian workspace [ids]
obsidian workspaces [total]
obsidian workspace:save [name=<name>]
obsidian workspace:load name=<name>
obsidian workspace:delete name=<name>

obsidian tabs [ids]
obsidian tab:open [group=<id>] [file=<path>] [view=<type>]
```

---

## Web Viewer

```bash
obsidian web url=<url> [newtab]
```

---

## Bases

```bash
obsidian bases
obsidian base:views
obsidian base:query [file=<name>] [view=<name>] [format=json|csv|tsv|md|paths]
obsidian base:create [file=<name>] [view=<name>] [name=<name>] [content=<text>] [open] [newtab]
```

---

## Developer Commands

```bash
obsidian eval code=<javascript>          # execute JS and return result
obsidian devtools                        # toggle Electron dev tools

obsidian dev:console [clear] [limit=<n>] [level=log|warn|error|info|debug]
obsidian dev:errors [clear]
obsidian dev:debug [on|off]              # attach/detach CDP debugger
obsidian dev:screenshot [path=<filename>]  # returns base64 PNG
obsidian dev:dom selector=<css> [attr=<name>] [css=<prop>] [total] [text] [inner] [all]
obsidian dev:css selector=<css> [prop=<name>]
obsidian dev:cdp method=<CDP.method> [params=<json>]
obsidian dev:mobile [on|off]
```

**Examples:**
```shell
obsidian eval code="app.vault.getFiles().length"
obsidian dev:screenshot path=screenshot.png
obsidian plugin:reload id=my-plugin
```

---

## TUI Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Move cursor left | `←` / `Ctrl+B` |
| Move cursor right (accepts suggestion at EOL) | `→` / `Ctrl+F` |
| Jump to start of line | `Ctrl+A` |
| Jump to end of line | `Ctrl+E` |
| Move back one word | `Alt+B` |
| Move forward one word | `Alt+F` |
| Delete to start of line | `Ctrl+U` |
| Delete to end of line | `Ctrl+K` |
| Delete previous word | `Ctrl+W` / `Alt+Backspace` |
| Enter suggestion mode / accept suggestion | `Tab` |
| Exit suggestion mode | `Shift+Tab` |
| Reverse history search | `Ctrl+R` |
| Previous history entry | `↑` / `Ctrl+P` |
| Next history entry | `↓` / `Ctrl+N` |
| Clear screen | `Ctrl+L` |
| Exit | `Ctrl+C` / `Ctrl+D` |

---

## Everyday Examples

```shell
# Open today's daily note
obsidian daily

# Add a task to your daily note
obsidian daily:append content="- [ ] Buy groceries"

# Search your vault
obsidian search query="meeting notes"

# Read the active file
obsidian read

# List all tasks from your daily note
obsidian tasks daily

# Create a new note from a template
obsidian create name="Trip to Paris" template=Travel

# List all tags in your vault with counts
obsidian tags counts

# Compare two versions of a file
obsidian diff file=README from=1 to=3

# Copy search results to clipboard
obsidian search query="TODO" --copy
```
