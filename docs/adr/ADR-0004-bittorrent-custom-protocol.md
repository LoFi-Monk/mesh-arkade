# ADR 0004: BitTorrent Custom Protocol Adjustments

**Status**: Accepted
**Date**: 2026-03-18

## Context and Problem Statement
MeshARKade requires a decentralized, takedown-resistant game preservation layer. We chose to build a P2P network on top of the BitTorrent Mainline DHT, but our curation model focuses on verifying specific ROM file hashes rather than entire torrent bundles. Standard BitTorrent libraries like `bittorrent-dht` expect BEP 3 compliance, which relies on torrent info dictionaries. We need a way to integrate our unique requirements while remaining compatible with the underlying UDP transport network, avoiding adversarial stalls, and working seamlessly within the Bare runtime.

## Decision
We implemented a custom, modularized BitTorrent DHT client and wire protocol (`src/fetch/layers/bittorrent/`) with three intentional design deviations from standard BitTorrent:

1. **SHA1 as DHT `info_hash`**: We use the ROM's SHA1 hash directly as the DHT `info_hash` rather than the SHA1 of a torrent's `info` dictionary (BEP 3). 
2. **Raw `Uint8Array` in `bdecode`**: `TextDecoder('latin1')` corrupts bytes 0x80–0x9F via Windows-1252 mapping. Our `bdecode` module operates strictly via byte-level index arithmetic to avoid character set corruption.
3. **Dual-Timer Pattern in `fetchFromPeer`**: We implement two timers: an overall `deadlineTimer` (never cleared by incoming data) and a 5-second `inactivityTimer` (reset on each block received).

## Consequences
- **Positive (SHA1 as `info_hash`)**: Enables our custom P2P mesh to find individual ROMs by their verified file hashes, perfectly aligning with our curator-first, DAT-verified model without the overhead of `.torrent` files.
- **Positive (Raw `bdecode`)**: Ensures binary integrity of node IDs, transaction IDs, and compact peer representations when exchanging Kademlia routing data.
- **Positive (Dual-Timer)**: Prevents adversarial peers from holding connections open indefinitely by trickling data, while accommodating peers with varying latency and bandwidth.
- **Negative**: Deviating from BEP 3 means our implementation cannot simply drop in an existing BitTorrent engine (e.g., WebTorrent). Other BitTorrent clients will not understand our requests for raw ROM hashes, effectively isolating our swarm to MeshARKade nodes, which means we must bootstrap our own peers.