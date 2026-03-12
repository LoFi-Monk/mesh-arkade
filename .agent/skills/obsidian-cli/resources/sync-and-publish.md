# Sync & Publish

## Sync

> These commands control Sync within the running Obsidian app. To sync without the desktop app, see [Headless Sync](https://help.obsidian.md/sync/headless).

### sync

Pause or resume sync.

```
on                 # resume sync
off                # pause sync
```

### sync:status

Show sync status and usage.

### sync:history

List sync version history for a file (default: active file).

```
file=<name>        # file name
path=<path>        # file path
total              # return version count
```

### sync:read

Read a sync version (default: active file).

```
file=<name>        # file name
path=<path>        # file path
version=<n>        # (required) version number
```

### sync:restore

Restore a sync version (default: active file).

```
file=<name>        # file name
path=<path>        # file path
version=<n>        # (required) version number
```

### sync:open

Open sync history (default: active file).

```
file=<name>        # file name
path=<path>        # file path
```

### sync:deleted

List deleted files in sync.

```
total              # return deleted file count
```

---

## Publish

### publish:site

Show publish site info (slug, URL).

### publish:list

List published files.

```
total              # return published file count
```

### publish:status

List publish changes.

```
total              # return change count
new                # show new files only
changed            # show changed files only
deleted            # show deleted files only
```

### publish:add

Publish a file or all changed files (default: active file).

```
file=<name>        # file name
path=<path>        # file path
changed            # publish all changed files
```

### publish:remove

Unpublish a file (default: active file).

```
file=<name>        # file name
path=<path>        # file path
```

### publish:open

Open file on published site (default: active file).

```
file=<name>        # file name
path=<path>        # file path
```
