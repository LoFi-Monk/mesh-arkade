## Context

The DAT ingestion epic (E004) enables Mesh-ARKade to parse and store community DATs (like No-Intro) in a local Hyperbee cache. The next step is utilizing this cache to verify actual ROM files. The core requirement is to stream a ROM, compute its CRC32 and SHA1 hashes, and use these hashes for an O(1) lookup in the Hyperbee store.

## Goals / Non-Goals

**Goals:**
- Provide a synchronous-like (async/await) function `verifyRom(filePath, systemName)`.
- Stream file contents efficiently without loading large ROMs entirely into memory.
- Compute both CRC32 and SHA1 hashes in a single pass.
- Guarantee an O(1) lookup in the Hyperbee database.
- Utilize a test strategy that prevents copyright infringement (ADR-0015).

**Non-Goals:**
- Batch verification or swarm integration (to be handled in future epics).
- Handling "bad dumps" (corruptions) differently from completely unknown files (as decided in ADR-0014).

## Decisions

- **Hashing Libraries**:
  - We will use Bare's native `bare-crypto` (aliased as `crypto`) for SHA1.
  - We will use the pure JS `crc-32` npm package for CRC32 computation.
  - *Rationale*: Bare does not have a native CRC32 implementation, and `crc-32` avoids pulling in Node-specific stream polyfills by allowing manual chunk feeding.
- **Strict Binary Verification**:
  - A lookup will return either `Verified` (exact hash match) or `Unknown`.
  - *Rationale*: Indexing Hyperbee by hash is the only way to achieve true O(1) lookups. Distinguishing between a "bad dump" and an "unknown" file would require secondary size indexes, violating the goal for lean schemas.
- **Mock Testing (ADR-0015)**:
  - All unit/integration tests will rely on dynamically generated mock buffers (e.g., `Buffer.from('FAKE_NES_ROM')`) and mock DAT entries inserted into a temporary Hyperbee store.
  - *Rationale*: We absolutely cannot commit real Nintendo or Sony IP to the repository.

## Risks / Trade-offs

- **Risk**: Users with slightly modified ROMs (e.g., headered SNES/NES ROMs) or fan translations will receive an "Unknown" status rather than a descriptive error about corruption.
  - **Mitigation**: This is an accepted trade-off to maintain archival integrity and database performance (ADR-0014).
- **Risk**: High CPU usage when hashing massive ROMs (e.g., 2GB PS1 bin/cue).
  - **Mitigation**: Streaming the file using `bare-fs` and processing chunks asynchronously ensures memory is bounded, even if CPU usage spikes momentarily.