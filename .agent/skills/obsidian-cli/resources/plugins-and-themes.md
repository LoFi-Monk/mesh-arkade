# Plugins & Themes

## plugins

List installed plugins.

```
filter=core|community  # filter by plugin type
versions               # include version numbers
format=json|tsv|csv    # output format (default: tsv)
```

## plugins:enabled

List enabled plugins.

```
filter=core|community
versions
format=json|tsv|csv
```

## plugins:restrict

Toggle or check restricted mode.

```
on                 # enable restricted mode
off                # disable restricted mode
```

## plugin

Get plugin info.

```
id=<plugin-id>     # (required) plugin ID
```

## plugin:enable

Enable a plugin.

```
id=<id>                # (required) plugin ID
filter=core|community  # plugin type
```

## plugin:disable

Disable a plugin.

```
id=<id>                # (required) plugin ID
filter=core|community  # plugin type
```

## plugin:install

Install a community plugin.

```
id=<id>            # (required) plugin ID
enable             # enable after install
```

## plugin:uninstall

Uninstall a community plugin.

```
id=<id>            # (required) plugin ID
```

## plugin:reload

Reload a plugin (useful for development).

```
id=<id>            # (required) plugin ID
```

---

## themes

List installed themes.

```
versions           # include version numbers
```

## theme

Show active theme or get info.

```
name=<name>        # theme name for details
```

## theme:set

Set active theme.

```
name=<name>        # (required) theme name (empty for default)
```

## theme:install

Install a community theme.

```
name=<name>        # (required) theme name
enable             # activate after install
```

## theme:uninstall

Uninstall a theme.

```
name=<name>        # (required) theme name
```

---

## snippets

List installed CSS snippets.

## snippets:enabled

List enabled CSS snippets.

## snippet:enable

Enable a CSS snippet.

```
name=<name>        # (required) snippet name
```

## snippet:disable

Disable a CSS snippet.

```
name=<name>        # (required) snippet name
```
