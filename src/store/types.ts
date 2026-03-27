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

/**
 * @intent   Represents the successful result of hashing a ROM file.
 * @guarantee On return, both crc32 and sha1 are uppercase hex strings; sha1 is 40 chars, crc32 is 8 chars.
 */
export interface HashRomSuccess {
  ok: true
  crc32: string
  sha1: string
}

/**
 * @intent   Represents a failed ROM hash operation.
 * @guarantee On return, error contains the failure reason.
 */
export interface HashRomError {
  ok: false
  error: {
    type: 'file-error'
    message: string
  }
}

/**
 * @intent   Represents the result of a ROM hash operation.
 * @guarantee On return, either success with both hashes, or failure with error details.
 */
export type HashRomResult = HashRomSuccess | HashRomError

/**
 * @intent   Represents a successfully verified ROM.
 * @guarantee On return, status is 'Verified' with entry metadata.
 */
export interface VerifyRomVerified {
  ok: true
  status: 'Verified'
  entry: StoredRomEntry
}

/**
 * @intent   Represents an unknown (unverified) ROM.
 * @guarantee On return, status is 'Unknown', entry is null.
 */
export interface VerifyRomUnknown {
  ok: true
  status: 'Unknown'
  entry: null
}

/**
 * @intent   Represents a failed verification due to hashing error.
 * @guarantee On return, error contains the failure reason.
 */
export interface VerifyRomHashError {
  ok: false
  error: {
    type: 'file-error'
    message: string
  }
}

/**
 * @intent   Represents the result of a ROM verification operation.
 * @guarantee On return, either Verified with metadata, Unknown without metadata, or error.
 */
export type VerifyRomResult = VerifyRomVerified | VerifyRomUnknown | VerifyRomHashError
