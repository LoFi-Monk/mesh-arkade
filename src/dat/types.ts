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