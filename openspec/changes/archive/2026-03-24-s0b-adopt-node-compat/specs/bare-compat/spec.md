## ADDED Requirements

### Requirement: Package aliases resolve Node built-ins to Bare equivalents
The `package.json` SHALL contain `npm:` aliases that map Node built-in module names to their `bare-node-*` equivalents. When application code calls `require('fs')`, `require('crypto')`, or `require('path')`, the module resolver SHALL load the corresponding Bare-compatible package in the Bare runtime and the native Node module in Node.

#### Scenario: require('fs') resolves in Bare runtime
- **WHEN** application code executes `require('fs')` in the Bare runtime
- **THEN** the module resolver loads `bare-node-fs` and returns a working filesystem API

#### Scenario: require('fs') resolves in Node runtime
- **WHEN** application code executes `require('fs')` in the Node runtime
- **THEN** the module resolver loads the native Node `fs` module

#### Scenario: require('crypto') resolves in Bare runtime
- **WHEN** application code executes `require('crypto')` in the Bare runtime
- **THEN** the module resolver loads `bare-node-crypto` and returns a working crypto API

#### Scenario: require('path') resolves in Bare runtime
- **WHEN** application code executes `require('path')` in the Bare runtime
- **THEN** the module resolver loads `bare-node-path` and returns a working path API

### Requirement: Global polyfills provide fetch, process, and Buffer
A `compat.js` file SHALL set `global.fetch`, `global.process`, and `global.Buffer` to their Bare equivalents when running in the Bare runtime. In the Node runtime, these globals already exist and SHALL not be overwritten.

#### Scenario: global.fetch is available in Bare runtime
- **WHEN** application code accesses `global.fetch` in the Bare runtime after `compat.js` has loaded
- **THEN** `fetch` is a callable function that performs HTTP requests

#### Scenario: global.process is available in Bare runtime
- **WHEN** application code accesses `global.process` in the Bare runtime after `compat.js` has loaded
- **THEN** `process` is an object with `env`, `cwd()`, and standard process properties

#### Scenario: global.Buffer is available in Bare runtime
- **WHEN** application code accesses `global.Buffer` in the Bare runtime after `compat.js` has loaded
- **THEN** `Buffer` is a constructor that creates buffer instances

#### Scenario: Node globals are not overwritten
- **WHEN** `compat.js` loads in the Node runtime
- **THEN** `global.fetch`, `global.process`, and `global.Buffer` retain their native Node implementations

### Requirement: compat.js loads before all other application modules
The entry point SHALL execute `require('./compat')` as its first statement, before any import that depends on `fetch`, `process`, or `Buffer`.

#### Scenario: Entry point loads compat first
- **WHEN** the application entry point executes
- **THEN** `require('./compat')` is the first executed statement, preceding all other imports

### Requirement: Tests pass in both Node and Bare runtimes
The test suite SHALL pass when run via `brittle` (Node) and `brittle-bare` (Bare). A dual-runtime test script SHALL exist to run both.

#### Scenario: Tests pass in Node via brittle
- **WHEN** `brittle dist/test/*.test.js` is executed
- **THEN** all tests pass with exit code 0

#### Scenario: Tests pass in Bare via brittle-bare
- **WHEN** `brittle-bare dist/test/*.test.js` is executed
- **THEN** all tests pass with exit code 0

### Requirement: New Node built-ins are added incrementally
When a new Node built-in module is needed, a corresponding `npm:bare-node-*` alias SHALL be added to `package.json` dependencies. The full Pear template alias set SHALL NOT be added preemptively.

#### Scenario: Adding a new built-in alias
- **WHEN** a developer needs `require('os')` to work in Bare
- **THEN** they add `"os": "npm:bare-node-os"` to `package.json` dependencies
