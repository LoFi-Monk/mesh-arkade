import type { default as Hyperbee } from 'hyperbee'
import type { default as Corestore } from 'corestore'

/**
 * @intent   Represents a stored ROM entry with full fingerprint cross-references.
 * @guarantee On return, contains game metadata and all available hash types.
 */
export interface StoredRomEntry {
  gameName: string
  romName: string
  size: number
  crc: string | null
  md5: string | null
  sha1: string | null
  sha256: string | null
  serial?: string
}

/**
 * @intent   Represents the result of storing a DAT file.
 * @guarantee On return, contains the count of entries stored.
 */
export interface StoreDatResult {
  ok: true
  romCount: number
}

/**
 * @intent   Represents the result of looking up a ROM by hash.
 * @guarantee On return, contains the stored entry and which hash type matched, or null.
 */
export interface LookupRomResult {
  ok: true
  entry: StoredRomEntry
  matchedBy: 'sha1' | 'md5' | 'crc' | 'sha256'
}

/**
 * @intent   Represents the mesh-arkade store with Hyperbee and Corestore instances.
 * @guarantee On return, provides access to the database, ready/close lifecycle, and store instance.
 */
export interface MeshStore {
  db: Hyperbee
  store: Corestore
  ready(): Promise<void>
  close(): Promise<void>
}
