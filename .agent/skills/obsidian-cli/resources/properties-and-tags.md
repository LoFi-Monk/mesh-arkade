# Properties, Tags & Aliases

## aliases

List aliases in the vault. Use `active` or `file`/`path` for a specific file.

```
file=<name>        # file name
path=<path>        # file path
total              # return alias count
verbose            # include file paths
active             # show aliases for active file
```

## properties

List properties in the vault. Use `active` or `file`/`path` for a specific file.

```
file=<name>        # show properties for file
path=<path>        # show properties for path
name=<name>        # get specific property count
sort=count         # sort by count (default: name)
format=yaml|json|tsv  # output format (default: yaml)
total              # return property count
counts             # include occurrence counts
active             # show properties for active file
```

## property:set

Set a property on a file (default: active file).

```
name=<name>                                    # (required) property name
value=<value>                                  # (required) property value
type=text|list|number|checkbox|date|datetime   # property type
file=<name>                                    # file name
path=<path>                                    # file path
```

## property:remove

Remove a property from a file (default: active file).

```
name=<name>        # (required) property name
file=<name>        # file name
path=<path>        # file path
```

## property:read

Read a property value from a file (default: active file).

```
name=<name>        # (required) property name
file=<name>        # file name
path=<path>        # file path
```

---

## tags

List tags in the vault. Use `active` or `file`/`path` for a specific file.

```
file=<name>        # file name
path=<path>        # file path
sort=count         # sort by count (default: name)
total              # return tag count
counts             # include tag counts
format=json|tsv|csv  # output format (default: tsv)
active             # show tags for active file
```

## tag

Get tag info.

```
name=<tag>         # (required) tag name
total              # return occurrence count
verbose            # include file list and count
```
