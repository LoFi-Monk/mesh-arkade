# Bases

## bases

List all `.base` files in the vault.

## base:views

List views in the current base file.

## base:create

Create a new item in a base. Defaults to the active base view if no file is specified.

```
file=<name>        # base file name
path=<path>        # base file path
view=<name>        # view name
name=<name>        # new file name
content=<text>     # initial content
open               # open file after creating
newtab             # open in new tab
```

## base:query

Query a base and return results.

```
file=<name>                    # base file name
path=<path>                    # base file path
view=<name>                    # view name to query
format=json|csv|tsv|md|paths   # output format (default: json)
```
