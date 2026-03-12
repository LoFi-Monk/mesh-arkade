# Daily Notes

## daily

Open daily note.

```
paneType=tab|split|window    # pane type to open in
```

## daily:path

Get daily note path. Returns the expected path even if the file hasn't been created yet.

## daily:read

Read daily note contents.

## daily:append

Append content to daily note.

```
content=<text>     # (required) content to append
paneType=tab|split|window
inline             # append without newline
open               # open file after adding
```

## daily:prepend

Prepend content to daily note.

```
content=<text>     # (required) content to prepend
paneType=tab|split|window
inline             # prepend without newline
open               # open file after adding
```
