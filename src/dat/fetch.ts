import type { DatFetchOptions, DatFetchResult, DatFetchError } from './types.js'

const BASE_URL = 'https://raw.githubusercontent.com/libretro/libretro-database/master'

/**
 * @intent   Fetches a CLRMamePro DAT file from the Libretro Database GitHub repository by system name.
 * @guarantee Returns either the raw DAT content with HTTP metadata, or a typed error.
 * @constraint Throws nothing - all errors are captured in the return value.
 */
export async function fetchDat(
  systemName: string,
  options?: DatFetchOptions
): Promise<DatFetchResult | DatFetchError> {
  const basePath = options?.basePath ?? 'dat'
  const url = `${BASE_URL}/${basePath}/${encodeURIComponent(systemName)}.dat`

  const headers: Record<string, string> = {}
  if (options?.ifNoneMatch) {
    headers['If-None-Match'] = options.ifNoneMatch
  }
  if (options?.ifModifiedSince) {
    headers['If-Modified-Since'] = options.ifModifiedSince
  }

  try {
    const response = await fetch(url, { headers })

    if (response.status === 200) {
      const content = await response.text()
      const etag = response.headers.get('ETag') ?? null
      const lastModified = response.headers.get('Last-Modified') ?? null
      const contentLengthHeader = response.headers.get('Content-Length')

      return {
        ok: true,
        content,
        etag,
        lastModified,
        contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : null,
      }
    }

    if (response.status === 304) {
      return {
        ok: false,
        error: {
          type: 'not-modified',
          message: 'Resource has not been modified since the requested date.',
          url,
        },
      }
    }

    if (response.status === 404) {
      return {
        ok: false,
        error: {
          type: 'not-found',
          message: 'The requested DAT file was not found.',
          url,
        },
      }
    }

    return {
      ok: false,
      error: {
        type: 'network-error',
        message: `Unexpected HTTP status: ${response.status}`,
        url,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: {
        type: 'network-error',
        message: err instanceof Error ? err.message : 'Unknown network error',
        url,
      },
    }
  }
}