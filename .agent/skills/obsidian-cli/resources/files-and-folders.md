# Files and Folders

## file

Show file info (default: active file).

```
file=<name>        # file name
path=<path>        # file path
```

Output: path, name, extension, size, created, modified.

## files

List files in the vault.

```
folder=<path>      # filter by folder
ext=<extension>    # filter by extension
total              # return file count
```

## folder

Show folder info.

```
path=<path>              # (required) folder path
info=files|folders|size  # return specific info only
```

## folders

List folders in the vault.

```
folder=<path>      # filter by parent folder
total              # return folder count
```

## open

Open a file.

```
file=<name>        # file name
path=<path>        # file path
newtab             # open in new tab
```

## create

Create or overwrite a file.

```
name=<name>        # file name
path=<path>        # file path
content=<text>     # initial content
template=<name>    # template to use
overwrite          # overwrite if file exists
open               # open file after creating
newtab             # open in new tab
```

## read

Read file contents (default: active file).

```
file=<name>        # file name
path=<path>        # file path
```

## append

Append content to a file (default: active file).

```
file=<name>        # file name
path=<path>        # file path
content=<text>     # (required) content to append
inline             # append without newline
```

## prepend

Prepend content after frontmatter (default: active file).

```
file=<name>        # file name
path=<path>        # file path
content=<text>     # (required) content to prepend
inline             # prepend without newline
```

## move

Move or rename a file (default: active file). Auto-updates internal links if enabled in vault settings.

```
file=<name>        # file name
path=<path>        # file path
to=<path>          # (required) destination folder or path
```

## rename

Rename a file (default: active file). Extension is preserved if omitted. Use `move` to rename and move simultaneously.

```
file=<name>        # file name
path=<path>        # file path
name=<name>        # (required) new file name
```

## delete

Delete a file (default: active file, trash by default).

```
file=<name>        # file name
path=<path>        # file path
permanent          # skip trash, delete permanently
```

---

# File History

## diff

List or compare versions from local File Recovery and Sync. Versions numbered newest to oldest.

```
file=<name>          # file name
path=<path>          # file path
from=<n>             # version number to diff from
to=<n>               # version number to diff to
filter=local|sync    # filter by version source
```

**Examples:**
```shell
diff                          # list all versions of active file
diff file=Recipe              # list versions of specific file
diff file=Recipe from=1       # compare latest version to current file
diff file=Recipe from=2 to=1  # compare two versions
diff filter=sync              # only show Sync versions
```

## history

List versions from File Recovery only.

```
file=<name>        # file name
path=<path>        # file path
```

## history:list

List all files with local history.

## history:read

Read a local history version.

```
file=<name>        # file name
path=<path>        # file path
version=<n>        # version number (default: 1)
```

## history:restore

Restore a local history version.

```
file=<name>        # file name
path=<path>        # file path
version=<n>        # (required) version number
```

## history:open

Open file recovery.

```
file=<name>        # file name
path=<path>        # file path
```

---

# Templates

## templates

List templates.

```
total              # return template count
```

## template:read

Read template content.

```
name=<template>    # (required) template name
title=<title>      # title for variable resolution
resolve            # resolve template variables ({{date}}, {{time}}, {{title}})
```

## template:insert

Insert template into active file.

```
name=<template>    # (required) template name
```

> **Tip:** Use `create path=<path> template=<name>` to create a file with a template.

---

# Unique Notes

## unique

Create unique note.

```
name=<text>        # note name
content=<text>     # initial content
paneType=tab|split|window
open               # open file after creating
```

---

# Outline

## outline

Show headings for the current file.

```
file=<name>        # file name
path=<path>        # file path
format=tree|md|json  # output format (default: tree)
total              # return heading count
```

---

# Word Count

## wordcount

Count words and characters (default: active file).

```
file=<name>        # file name
path=<path>        # file path
words              # return word count only
characters         # return character count only
```
