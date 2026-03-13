# Specification: Decentralized Trust & Preservation Standards

This document codifies the "Accessible Museum" philosophy and the technical safeguards required to maintain archival integrity in the MeshARKade P2P network.

## 🏛️ The Curator-First Philosophy
1.  **Verification Precedes Playback**: No game or system file (BIOS) shall be presented in the user interface until its hash has been verified against a trusted No-Intro or Redump DAT source.
2.  **Archival Masters Only**: The system explicitly targets "Clean Dumps." Hacks, translations, and prototypes are valuable but must be isolated in secondary, clearly labeled swarms.
3.  **No Hand-Waving**: If a file fails verification, it is treated as "Corruption" (a bad dump) and rejected from the primary preservation swarm.

## 🛡️ Anti-Spoofing & The Root of Trust
To prevent "Poisoning the Well" (malicious DAT/BIOS files), MeshARKade employs the following stack:

### 1. Ed25519 Signed Hypercores
The "Canonical DAT Swarm" is not a public-writable directory. It is a Hypercore signed by one or more **Guardian Keys**.
-   **Guards**: A hardcoded list of public keys representing trusted curators.
-   **Verification**: Every node automatically rejects DAT updates that do not carry a valid signature from a Guardian.

### 2. Multi-Sig Consensus (Guardian Council)
Critical infrastructure updates (like the BIOS Vault DATs) require **M-of-N signatures** from the Guardian Council before they are propagated as "Canonical."

### 3. Bit-Perfect Normalization (TorrentZip)
To ensure swarm health, the "Collection Scanner" must normalize files:
-   **Header Stripping**: Removing non-archival copier headers (.smc -> .sfc).
-   **TorrentZip**: Re-compressing archives using a deterministic algorithm so that two users with the same game always produce the identical infohash.

## 📊 Technical Requirements
-   **Metadata Integrity**: Every entry must include: Title, System, Region, File Hash (SHA1/CRC32), and the **Guardian Signature** of the DAT entry.
-   **Local Streaming Bridge**: ROMs must be streamed to emulators via a secure local bridge to prevent IPC data leakage and memory bottlenecks.

---
*Created: 2026-03-12*
*Status: Canonical Architecture*
