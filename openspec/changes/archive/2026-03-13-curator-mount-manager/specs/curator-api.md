# Spec: Curator API & Interface

## 1. JSON-RPC Methods

### `curator:mount`
- **Params**: `{ path: string }`
- **Expected Outcome**: 
  - Validates path exists and is a directory.
  - Generates/loads `.mesh-hub/` index.
  - Adds path to `mounts.json`.
  - Returns the initialized mount object (path, status, fileCount).

### `curator:unmount`
- **Params**: `{ path: string }`
- **Expected Outcome**:
  - Removes path from active state and `mounts.json`.
  - Closes any open Hypercore descriptors.

### `curator:list`
- **Params**: `null`
- **Expected Outcome**:
  - Returns an array of active mount objects.

## 2. CLI Commands

### `mount <path>`
- **Behavior**: Calls `curator:mount` and prints a success message with the number of files discovered.

### `unmount <path>`
- **Behavior**: Calls `curator:unmount` and confirms removal.

### `list-mounts` (alias `mounts`)
- **Behavior**: Lists all active mounts in a formatted 8-bit ASCII table.

## 3. The Curator Wizard (First Run)

### Requirement: First Run Discovery
- **GIVEN** `mounts.json` is missing or empty.
- **WHEN** `pear run --bare .` is executed.
- **THEN** The CLI prints: `[MUSEUM BOOT] No libraries detected. Initialization required.`
- **AND** Prompts: `Where is your library? (Enter path): `
- **AND** On valid entry, performs the initial mount and proceeds to the standard engine splash.
