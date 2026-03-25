import type { MeshStore } from './types.js'
import type { LookupRomResult, StoredRomEntry } from './types.js'

/**
 * @intent   Look up a ROM by hash with fallback chain (SHA1 -\> MD5 -\> CRC -\> SHA256).
 * @guarantee On return, the first matching hash type is returned with a matchedBy indicator; null if no match.
 * @constraint Hash input is normalized to uppercase before lookup. Store must be initialized before calling.
 */
export async function lookupRom(
  store: MeshStore,
  systemName: string,
  hash: string
): Promise<LookupRomResult | null> {
  await store.ready()

  const db = store.db.sub('dat').sub(systemName)
  const normalizedHash = hash.toUpperCase()

  const sha1Result = await db.get(`sha1:${normalizedHash}`)
  if (sha1Result) {
    return {
      ok: true,
      entry: sha1Result.value as StoredRomEntry,
      matchedBy: 'sha1',
    }
  }

  const md5Result = await db.get(`md5:${normalizedHash}`)
  if (md5Result) {
    return {
      ok: true,
      entry: md5Result.value as StoredRomEntry,
      matchedBy: 'md5',
    }
  }

  const crcResult = await db.get(`crc:${normalizedHash}`)
  if (crcResult) {
    return {
      ok: true,
      entry: crcResult.value as StoredRomEntry,
      matchedBy: 'crc',
    }
  }

  const sha256Result = await db.get(`sha256:${normalizedHash}`)
  if (sha256Result) {
    return {
      ok: true,
      entry: sha256Result.value as StoredRomEntry,
      matchedBy: 'sha256',
    }
  }

  return null
}
