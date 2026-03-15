## ADDED Requirements

### Requirement: Sequential layer orchestration
`FetchManager` SHALL attempt the three P2P fetch layers in fixed order: Hyperswarm → IPFS → BitTorrent DHT. It MUST move to the next layer only when the current layer rejects (timeout or error). It MUST resolve with the `Buffer` returned by the first layer that succeeds.

#### Scenario: Hyperswarm succeeds
- **WHEN** the Hyperswarm layer resolves with a file `Buffer`
- **THEN** `FetchManager` resolves immediately without invoking the IPFS or BitTorrent layers

#### Scenario: Hyperswarm fails, IPFS succeeds
- **WHEN** the Hyperswarm layer rejects and the IPFS layer resolves with a file `Buffer`
- **THEN** `FetchManager` resolves with the IPFS result without invoking the BitTorrent layer

#### Scenario: All layers fail
- **WHEN** all three layers reject
- **THEN** `FetchManager` rejects with an `AllLayersFailedError` that aggregates the individual layer errors

---

### Requirement: Progress reporting
`FetchManager` SHALL emit byte-progress events as each layer streams data. It MUST expose an `onProgress(callback: (received: number, total: number | null) => void)` method. The `total` parameter MAY be `null` when the file size is unknown (e.g., during Hyperswarm streaming). Progress MUST reset to zero when falling back to a new layer.

#### Scenario: Progress callback called during streaming
- **WHEN** a fetch layer streams bytes
- **THEN** the registered `onProgress` callback is called at least once per chunk with cumulative `received` bytes

#### Scenario: Total unknown during Hyperswarm
- **WHEN** the Hyperswarm layer is active and the file size is not pre-negotiated
- **THEN** `onProgress` is called with `total = null`

---

### Requirement: Stage directory output
`FetchManager.fetch(sha1, destDir)` SHALL write the resolved file to `destDir/<game-name>` using `getFs()` from `src/core/runtime.ts`. The filename MUST be derived from the DAT record resolved by `dat-parser.resolveByShortSha1(sha1)`. If no DAT record exists, the filename SHALL default to `<sha1>.bin`.

#### Scenario: DAT record found
- **WHEN** `dat-parser.resolveByShortSha1(sha1)` returns a game record with `name: "Kirby's Adventure (USA)"`
- **THEN** the file is written to `destDir/Kirby's Adventure (USA)`

#### Scenario: No DAT record
- **WHEN** `dat-parser.resolveByShortSha1(sha1)` returns `null`
- **THEN** the file is written to `destDir/<sha1>.bin`

---

### Requirement: Factory instantiation
`FetchManager` MUST be exported as a class (not a singleton). A new instance MUST be created for each `mesh fetch` invocation. The constructor SHALL accept an optional `timeout` parameter (milliseconds per layer, default 30000).

#### Scenario: Per-invocation instance
- **WHEN** `mesh fetch` is called twice concurrently
- **THEN** two independent `FetchManager` instances are created with no shared state

---

### Requirement: mesh fetch CLI command
`src/cli/commands/fetch.ts` SHALL export a `handleFetch(args, hub)` function that:
1. Validates the SHA1 argument (40 hex chars, case-insensitive)
2. Resolves the active mounted library's `stage/` path from `hub`
3. Instantiates `FetchManager` and calls `fetch(sha1, stagePath)`
4. Renders a real-time progress bar using the `onProgress` callback
5. Prints a success or failure summary on completion

#### Scenario: Valid SHA1 and active library
- **WHEN** `mesh fetch aabb...` is invoked with a valid SHA1 and a mounted library
- **THEN** the progress bar renders during download and `Staged: <filename>` is printed on success

#### Scenario: Invalid SHA1 format
- **WHEN** `mesh fetch notasha1` is invoked
- **THEN** the command prints `Error: invalid SHA1 — expected 40 hex characters` and exits with code 1

#### Scenario: No library mounted
- **WHEN** `mesh fetch <sha1>` is invoked with no mounted library
- **THEN** the command prints `Error: no library mounted. Use 'mesh mount <path>' first` and exits with code 1
