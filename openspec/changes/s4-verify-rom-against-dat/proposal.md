## Why

To build a museum-quality, takedown-resistant game preservation platform, we must guarantee the fidelity of the ROMs we serve and store. Without verification against known DATs (like No-Intro or Redump), the entire pipeline produces untrustworthy data. We need to compute the hashes (CRC32 and SHA1) of a ROM file and verify them in O(1) time against our cached Hyperbee DAT store to definitively state if a dump is verified.

## What Changes

- Introduce a core ROM verification function.
- Implement streaming file hashing to calculate CRC32 and SHA1 simultaneously.
- Introduce a strict verification boundary: ROMs are either `Verified` (exact hash match in the DAT) or `Unknown` (no match). The "bad dump" concept is intentionally excluded per ADR-0014 to maintain O(1) lookups and a lean architecture.
- Adopt a copyright-safe testing strategy (ADR-0015) using mock ROM buffers and dynamically generated DAT entries to prevent Nintendo IP or other copyrighted files from entering the codebase.

## Capabilities

### New Capabilities
- `rom-verification`: Core capability to stream a file, compute CRC32 and SHA1, and perform an O(1) lookup in the Hyperbee DAT store to return a `Verified` or `Unknown` status.

### Modified Capabilities
- None.

## Impact

- Introduces new pure JS dependency `crc-32` for streaming CRC32 computation.
- Relies on `bare-crypto` (aliased as `crypto`) for SHA1.
- Integrates with the existing S3 Hyperbee data layer (`src/store/`).
- Establishes the foundational logic that future swarm and batch-import epics will rely on to reject bad peers or corrupted files.