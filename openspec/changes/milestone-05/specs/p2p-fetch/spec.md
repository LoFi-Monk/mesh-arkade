## ADDED Requirements

### Requirement: Hyperswarm layer discovery
The Hyperswarm fetch layer SHALL derive a 32-byte topic from a 40-char hex SHA1 (20-byte Buffer zero-padded to 32 bytes) and join a Hyperswarm topic to discover peers. It MUST establish a connection and stream the full ROM file from the first responsive peer. The layer MUST close the swarm and resolve with the received bytes when a peer successfully delivers the file, or reject after a configurable timeout (default 30 s).

#### Scenario: Peer found and file streamed
- **WHEN** a Hyperswarm peer is connected for the topic derived from a valid SHA1
- **THEN** the layer streams all bytes from the peer and resolves with a `Buffer` of the file contents

#### Scenario: No peers within timeout
- **WHEN** no Hyperswarm peer responds within the configured timeout
- **THEN** the layer rejects with a `FetchLayerTimeoutError` and closes the swarm cleanly

#### Scenario: Topic derivation from SHA1
- **WHEN** SHA1 `"aabbcc..."` (40 hex chars) is provided
- **THEN** the topic is `Buffer.from("aabbcc...", "hex")` zero-padded to 32 bytes

---

### Requirement: IPFS gateway layer
The IPFS fetch layer SHALL look up the provided SHA1 in the bundled Museum Map (`src/fetch/museum-map.json`) to obtain a CID, then fetch the file from a public IPFS HTTP gateway using `getFetch()`. It MUST resolve with the full file `Buffer` on success, or reject with a `FetchLayerError` if the SHA1 is absent from the map or the gateway request fails.

#### Scenario: SHA1 found in Museum Map
- **WHEN** the SHA1 exists in `museum-map.json` and the IPFS gateway returns HTTP 200
- **THEN** the layer resolves with the file `Buffer`

#### Scenario: SHA1 not in Museum Map
- **WHEN** the SHA1 has no entry in `museum-map.json`
- **THEN** the layer rejects with `FetchLayerError` containing reason `"not-in-museum-map"`

#### Scenario: Gateway request fails
- **WHEN** the IPFS HTTP gateway returns a non-200 status or network error
- **THEN** the layer rejects with `FetchLayerError` containing the HTTP status code

---

### Requirement: BitTorrent DHT layer
The BitTorrent DHT fetch layer SHALL use the SHA1 as a BitTorrent infohash to locate peers in the public DHT using the `bittorrent-dht` package. It MUST retrieve all torrent pieces from discovered peers and assemble them into the full file `Buffer`. The layer MUST reject with `FetchLayerTimeoutError` if no peers respond within the configured timeout (default 30 s).

#### Scenario: DHT peers found and pieces assembled
- **WHEN** DHT peers announce the SHA1 infohash and serve torrent pieces
- **THEN** the layer assembles all pieces and resolves with the complete file `Buffer`

#### Scenario: No DHT peers within timeout
- **WHEN** no peers announce the infohash within the configured timeout
- **THEN** the layer rejects with `FetchLayerTimeoutError`

---

### Requirement: Bare runtime compatibility
All three fetch layers MUST use `getFetch()` from `src/core/runtime.ts` for any HTTP requests. Layers MUST NOT import `http`, `https`, or any Node.js built-in directly. Layers MUST use `getFs()` only for writing staged output, never for in-memory buffering.

#### Scenario: No forbidden imports
- **WHEN** layer source files are analyzed for import statements
- **THEN** no direct imports of `http`, `https`, `node:*`, or browser-only globals are present
