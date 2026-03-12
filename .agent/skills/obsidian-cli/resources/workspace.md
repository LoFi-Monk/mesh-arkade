# Workspace

## workspace

Show workspace tree.

```
ids                # include workspace item IDs
```

## workspaces

List saved workspaces.

```
total              # return workspace count
```

## workspace:save

Save current layout as workspace.

```
name=<name>        # workspace name
```

## workspace:load

Load a saved workspace.

```
name=<name>        # (required) workspace name
```

## workspace:delete

Delete a saved workspace.

```
name=<name>        # (required) workspace name
```

---

## tabs

List open tabs.

```
ids                # include tab IDs
```

## tab:open

Open a new tab.

```
group=<id>         # tab group ID
file=<path>        # file to open
view=<type>        # view type to open
```

## recents

List recently opened files.

```
total              # return recent file count
```

---

## Vault

### vault

Show vault info.

```
info=name|path|files|folders|size  # return specific info only
```

### vaults

List known vaults.

```
total              # return vault count
verbose            # include vault paths
```

### vault:open

Switch to a different vault (TUI only).

```
name=<name>        # (required) vault name
```

---

## Web Viewer

### web

Open URL in web viewer.

```
url=<url>          # (required) URL to open
newtab             # open in new tab
```

---

## Random Notes

### random

Open a random note.

```
folder=<path>      # limit to folder
newtab             # open in new tab
```

### random:read

Read a random note (includes path).

```
folder=<path>      # limit to folder
```
