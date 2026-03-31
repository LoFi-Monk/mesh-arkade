/**
 * @intent   Represents metadata from a CLRMamePro DAT file header.
 * @guarantee On return, contains header fields extracted from clrmamepro or header block.
 */
export interface DatHeader {
  name: string
  description?: string
  version?: string
  author?: string
  homepage?: string
  url?: string
}

/**
 * @intent   Represents a ROM entry within a game in a DAT file.
 * @guarantee On return, contains ROM identification and optional checksums.
 */
export interface DatRom {
  name: string
  size: number
  crc?: string
  md5?: string
  sha1?: string
  sha256?: string
  serial?: string
  developer?: string
  genre?: string
  releaseyear?: string
  releasemonth?: string
  publisher?: string
  region?: string
}

/**
 * @intent   Represents a game entry in a DAT file.
 * @guarantee On return, contains game name, optional metadata, and array of ROMs.
 */
export interface DatGame {
  name: string
  description?: string
  comment?: string
  roms: DatRom[]
}

/**
 * @intent   Represents a parsed CLRMamePro DAT file structure.
 * @guarantee On return, contains header metadata and array of game entries.
 */
export interface DatFile {
  header: DatHeader
  games: DatGame[]
}

/**
 * @intent   Represents a successful parse of a DAT file.
 * @guarantee On return, contains the parsed DatFile structure.
 */
export interface DatParseResult {
  ok: true
  dat: DatFile
}

/**
 * @intent   Represents a failed parse attempt with error details.
 * @guarantee On return, contains error type and diagnostic information including line number.
 */
export interface DatParseError {
  ok: false
  error: {
    type: 'parse-error'
    message: string
    line?: number
  }
}

/**
 * @intent   Represents a successful fetch of a DAT file from the Libretro Database.
 * @guarantee On return, contains the raw DAT file content and HTTP metadata for caching.
 */
export interface DatFetchResult {
  ok: true
  content: string
  etag: string | null
  lastModified: string | null
  contentLength: number | null
}

/**
 * @intent   Represents a failed fetch attempt with a typed error.
 * @guarantee On return, contains error type and diagnostic information.
 */
export interface DatFetchError {
  ok: false
  error: {
    type: 'not-found' | 'network-error' | 'not-modified'
    message: string
    url: string
  }
}

/**
 * @intent   Options for conditional HTTP requests to enable caching.
 * @guarantee When provided, sets If-None-Match and/or If-Modified-Since headers.
 */
export interface DatFetchOptions {
  ifNoneMatch?: string
  ifModifiedSince?: string
  basePath?: string
}

/**
 * @intent   Represents a successful fetch of the system index from the Libretro Database.
 * @guarantee On return, contains an array of available system names from the repository.
 */
export interface SystemIndexResult {
  ok: true
  systems: string[]
}

/**
 * @intent   Represents a failed fetch of the system index with a typed error.
 * @guarantee On return, contains error type and diagnostic information including the failing URL.
 */
export interface SystemIndexError {
  ok: false
  error: {
    type: 'network-error' | 'rate-limited'
    message: string
    url: string
  }
}