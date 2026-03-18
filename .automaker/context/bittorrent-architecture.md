# BitTorrent Custom Protocol Architecture

This document provides architectural context for the `src/fetch/layers/bittorrent/` module hierarchy and its relationship with the overarching MeshARKade preservation network.

## Why a Custom DHT Implementation?

Standard Node.js BitTorrent packages like `bittorrent-dht` or `webtorrent` are heavily coupled with standard Node.js APIs (`fs`, `dgram`, `net`, `crypto`). MeshARKade operates within the **Pear Runtime** and uses polyfilled Bare equivalents (e.g., `bare-dgram`, `bare-net`).

We rolled our own DHT and wire protocol to ensure **100% compatibility with the Bare runtime**, minimizing binary overhead and tightly controlling memory. Additionally, our implementation allows us to circumvent the `.torrent` metadata structure expected by typical library implementations.

## Deviations from Standard BEP 3

MeshARKade is fundamentally a **Curator-First** platform. It validates ROM file hashes against DAT files, establishing an absolute ground-truth for preservation. 

1. **SHA1-as-`info_hash`**: The standard BitTorrent specification (BEP 3) uses the SHA1 hash of the bencoded `info` dictionary of a `.torrent` file as the DHT `get_peers` query token. In contrast, MeshARKade uses the **SHA1 hash of the individual ROM file itself** as the `info_hash`. This forms a unique sub-mesh of peers serving specific, verifiable game files without needing a `.torrent` file to bridge the gap.
2. **Raw `Uint8Array` in `bdecode`**: We bypass standard `TextDecoder` mappings (which corrupt bytes 0x80-0x9F via Windows-1252 parsing) and implement byte-level arithmetic.
3. **Dual-Timer Pattern**: The `fetchFromPeer` routine employs two distinct timers—a global `deadlineTimer` for the overarching task, and a granular `inactivityTimer` (reset per block received). This actively mitigates attacks where adversarial peers hold connections open indefinitely with trickles of data.

## Trust Chain: End-to-End Content Integrity

The trust chain guarantees that regardless of which peer serves a file, the final ROM is museum-quality and authentic:

1. **DAT File (Ground Truth)**: Curators load authoritative DAT files (e.g., No-Intro, Redump) into the local database. The DAT provides the true SHA1 file hash for a specific title/region.
2. **Kademlia Lookup**: The DHT Client issues `get_peers` Kademlia lookups for the target SHA1 hash.
3. **Wire Protocol Assembly**: Data is retrieved in 16KB blocks via the BitTorrent TCP wire protocol and assembled by `tcp-peer.ts`.
4. **Final Hash Verification**: The final, assembled byte sequence is explicitly verified against the original DAT-provided SHA1 hash before yielding the file up the layer hierarchy. Any mismatch drops the connection and moves to the next peer.

## Module Map

The `bittorrent/` directory isolates responsibilities to enforce SOLID principles and high testability:

| Module | Responsibility |
|--------|----------------|
| `index.ts` | The public boundary. Exposes `fetchFromBittorrent` and coordinates overall timeout parameters and the `verifySha1` execution. |
| `bencode.ts` | Pure encoding/decoding logic for the Bencode format using `Uint8Array` arithmetic. Safe from Windows-1252 corruption. |
| `dht-utils.ts` | Small routing and parsing primitives: `xorDistance`, hex conversion utilities, random node ID generation, and Kademlia routing payloads. |
| `udp-transceiver.ts` | The UDP wrapper using `bare-dgram`. Tracks pending transactions and routes returning messages via timeouts and callbacks. |
| `dht-client.ts` | The Kademlia crawler. Orchestrates recursive Kademlia lookups across bootstrap nodes using the `UDPTransceiver`. |
| `tcp-peer.ts` | The BitTorrent Wire Protocol via `bare-net`. Executes the handshake, handles PIECE aggregation via the Dual-Timer approach, and validates chunk indices. |
