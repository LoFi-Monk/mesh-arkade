# Developer Commands

Tools for plugin and theme development. Enables agentic coding tools to automatically test and debug.

## devtools

Toggle Electron dev tools.

## dev:debug

Attach/detach Chrome DevTools Protocol debugger.

```
on                 # attach debugger
off                # detach debugger
```

## dev:cdp

Run a Chrome DevTools Protocol command.

```
method=<CDP.method>  # (required) CDP method to call
params=<json>        # method parameters as JSON
```

## dev:errors

Show captured JavaScript errors.

```
clear              # clear the error buffer
```

## dev:screenshot

Take a screenshot (returns base64 PNG).

```
path=<filename>    # output file path
```

## dev:console

Show captured console messages.

```
limit=<n>                        # max messages to show (default 50)
level=log|warn|error|info|debug  # filter by log level
clear                            # clear the console buffer
```

## dev:css

Inspect CSS with source locations.

```
selector=<css>     # (required) CSS selector
prop=<name>        # filter by property name
```

## dev:dom

Query DOM elements.

```
selector=<css>     # (required) CSS selector
attr=<name>        # get attribute value
css=<prop>         # get CSS property value
total              # return element count
text               # return text content
inner              # return innerHTML instead of outerHTML
all                # return all matches instead of first
```

## dev:mobile

Toggle mobile emulation.

```
on                 # enable mobile emulation
off                # disable mobile emulation
```

## eval

Execute JavaScript and return result.

```
code=<javascript>  # (required) JavaScript code to execute
```
