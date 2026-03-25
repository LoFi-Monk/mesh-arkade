import type { SystemIndexResult, SystemIndexError } from './types.js'

const SYSTEM_INDEX_URL = 'https://api.github.com/repos/libretro/libretro-database/contents/dat'

/**
 * @intent   Fetches the list of available system names from the Libretro Database GitHub repository.
 * @guarantee Returns either an array of canonical system names (stripped of .dat extension), or a typed error.
 * @constraint Throws nothing - all errors are captured in the return value. HTTP 403 returns rate-limited error.
 */
export async function fetchSystemIndex(): Promise<SystemIndexResult | SystemIndexError> {
  try {
    const response = await fetch(SYSTEM_INDEX_URL)

    if (response.status === 200) {
      const data: Array<{ name: string; type: string }> = await response.json()

      const systems = data
        .filter((entry) => entry.type === 'file' && entry.name.endsWith('.dat'))
        .map((entry) => entry.name.slice(0, -4))

      return {
        ok: true,
        systems,
      }
    }

    if (response.status === 403) {
      return {
        ok: false,
        error: {
          type: 'rate-limited',
          message: 'GitHub API rate limit exceeded. Please try again later.',
          url: SYSTEM_INDEX_URL,
        },
      }
    }

    return {
      ok: false,
      error: {
        type: 'network-error',
        message: `Unexpected HTTP status: ${response.status}`,
        url: SYSTEM_INDEX_URL,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: {
        type: 'network-error',
        message: err instanceof Error ? err.message : 'Unknown network error',
        url: SYSTEM_INDEX_URL,
      },
    }
  }
}

/**
 * @intent   Resolves a user query to matching system names via case-insensitive substring matching.
 * @guarantee Returns all system names where the query appears as a substring (case-insensitive). Returns empty array for blank input.
 * @constraint Returns empty array if no matches found or query is blank. Returns multiple matches when query matches more than one system.
 */
export function resolveSystemName(query: string, systems: string[]): string[] {
  if (query.trim() === '') return []
  const lowerQuery = query.toLowerCase()
  return systems.filter((system) => system.toLowerCase().includes(lowerQuery))
}