import type { MeshStore, StoredRomEntry } from '../store/types.js'
import { hashRom } from './rom-hasher.js'
import { lookupRom } from '../store/dat-lookup.js'

/**
 * @intent   Verify a ROM file against the cached Hyperbee DAT store for a given system.
 * @guarantee On return, status is either 'Verified' (with entry metadata) or 'Unknown'.
 * @constraint Uses O(1) hash key lookup in Hyperbee. Does NOT distinguish bad dumps from unknown files per ADR-0014.
 */
export async function verifyRom(
  filePath: string,
  systemName: string,
  store: MeshStore
): Promise<{ status: 'Verified'; entry: StoredRomEntry } | { status: 'Unknown'; entry: null }> {
  const { sha1, crc32 } = await hashRom(filePath)

  const sha1Result = await lookupRom(store, systemName, sha1)
  if (sha1Result) {
    return {
      status: 'Verified',
      entry: sha1Result.entry,
    }
  }

  const crcResult = await lookupRom(store, systemName, crc32)
  if (crcResult) {
    return {
      status: 'Verified',
      entry: crcResult.entry,
    }
  }

  return {
    status: 'Unknown',
    entry: null,
  }
}
