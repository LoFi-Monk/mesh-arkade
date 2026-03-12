# Search

## search

Search vault for text. Returns matching file paths.

```
query=<text>       # (required) search query
path=<folder>      # limit to folder
limit=<n>          # max files
format=text|json   # output format (default: text)
total              # return match count
case               # case sensitive
```

## search:context

Search with matching line context. Returns grep-style `path:line: text` output.

```
query=<text>       # (required) search query
path=<folder>      # limit to folder
limit=<n>          # max files
format=text|json   # output format (default: text)
case               # case sensitive
```

## search:open

Open search view.

```
query=<text>       # initial search query
```
