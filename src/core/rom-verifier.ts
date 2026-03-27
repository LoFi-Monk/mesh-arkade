import type { VerifyRomResult, MeshStore } from '../store/types.js'
import { hashRom } from './rom-hasher.js'
import { lookupByType } from '../store/dat-lookup.js'

/**
 * @intent   Verify a ROM file against the cached Hyperbee DAT store for a given system.
 * @guarantee On return, status is 'Verified' with entry metadata, 'Unknown', or error.
 * @constraint Uses O(1) direct hash key lookups (sha1 then crc) for efficiency. Does NOT distinguish bad dumps from unknown files per ADR-0014.
 */
export async function verifyRom(
  filePath: string,
  systemName: string,
  store: MeshStore
): Promise<VerifyRomResult> {
  const hashResult = await hashRom(filePath)

  if (!hashResult.ok) {
    return {
      ok: false,
      error: hashResult.error,
    }
  }

  const sha1Result = await lookupByType(store, systemName, 'sha1', hashResult.sha1)
  if (sha1Result) {
    return {
      ok: true,
      status: 'Verified',
      entry: sha1Result.entry,
    }
  }

  const crcResult = await lookupByType(store, systemName, 'crc', hashResult.crc32)
  if (crcResult) {
    return {
      ok: true,
      status: 'Verified',
      entry: crcResult.entry,
    }
  }

  return {
    ok: true,
    status: 'Unknown',
    entry: null,
  }
}
