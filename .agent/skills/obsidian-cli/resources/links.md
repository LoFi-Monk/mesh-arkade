# Links

## backlinks

List backlinks to a file (default: active file).

```
file=<name>        # target file name
path=<path>        # target file path
counts             # include link counts
total              # return backlink count
format=json|tsv|csv  # output format (default: tsv)
```

## links

List outgoing links from a file (default: active file).

```
file=<name>        # file name
path=<path>        # file path
total              # return link count
```

## unresolved

List unresolved links in vault.

```
total              # return unresolved link count
counts             # include link counts
verbose            # include source files
format=json|tsv|csv  # output format (default: tsv)
```

## orphans

List files with no incoming links.

```
total              # return orphan count
```

## deadends

List files with no outgoing links.

```
total              # return dead-end count
```
