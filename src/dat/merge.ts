import { fetchDat } from './fetch.js'
import { parseDat } from './parser.js'
import type { DatFile, DatGame } from './types.js'

const REGION_ALLOWLIST = new Set([
  'usa',
  'us',
  'europe',
  'eu',
  'japan',
  'jp',
  'world',
  'worldwide',
  'asia',
  'china',
  'korea',
  'kr',
  'brazil',
  'br',
  'australia',
  'au',
  'russia',
  'ru',
  'italy',
  'france',
  'fr',
  'germany',
  'de',
  'spain',
  'es',
  'uk',
  'united kingdom',
  'sweden',
  'nl',
  'netherlands',
  'poland',
  'pl',
  'czech',
  'hungary',
  'finland',
  'norway',
  'denmark',
  'canada',
  'ca',
  'mexico',
  'mx',
  'argentina',
  'ar',
  'chile',
  'cl',
  'colombia',
  'co',
  'hong kong',
  'hk',
  'taiwan',
  'tw',
  'singapore',
  'sg',
  'thailand',
  'th',
  'indonesia',
  'id',
  'malaysia',
  'my',
  'philippines',
  'ph',
  'india',
  'in',
  'israel',
  'south africa',
  'za',
  'new zealand',
  'nz',
])

export interface SupplementaryDatResult {
  type: 'developer' | 'genre' | 'releaseyear' | 'releasemonth' | 'publisher'
  games: Map<string, { comment: string; value: string }>
}

export interface MergeResult {
  ok: true
  mainDat: DatFile
  supplementary: SupplementaryDatResult[]
}

export interface MergeError {
  ok: false
  error: {
    type: 'fetch-error' | 'parse-error'
    message: string
    supplementaryFailed?: string[]
  }
}

export type MergeResultOrError = MergeResult | MergeError

const SUPPLEMENTARY_PATHS = [
  { type: 'developer' as const, basePath: 'metadat/developer' },
  { type: 'genre' as const, basePath: 'metadat/genre' },
  { type: 'releaseyear' as const, basePath: 'metadat/releaseyear' },
  { type: 'releasemonth' as const, basePath: 'metadat/releasemonth' },
  { type: 'publisher' as const, basePath: 'metadat/publisher' },
]

/**
 * @intent   Fetch and merge main DAT with supplementary metadata DATs.
 * @guarantee Returns merged DAT file with enriched entries, or error with details.
 * @constraint systemName must be a canonical No-Intro/Libretro system name.
 */
export async function mergeDat(
  systemName: string
): Promise<MergeResultOrError> {
  const mainFetchResult = await fetchDat(systemName, { basePath: 'dat' })

  if (!mainFetchResult.ok) {
    return {
      ok: false,
      error: {
        type: 'fetch-error',
        message: mainFetchResult.error.message,
      },
    }
  }

  const mainParseResult = parseDat(mainFetchResult.content)
  if (!mainParseResult.ok) {
    return {
      ok: false,
      error: {
        type: 'parse-error',
        message: mainParseResult.error.message,
      },
    }
  }

  const supplementaryResults: SupplementaryDatResult[] = []
  const failedSupplementary: string[] = []

  for (const sup of SUPPLEMENTARY_PATHS) {
    const supFetchResult = await fetchDat(systemName, { basePath: sup.basePath })

    if (!supFetchResult.ok) {
      failedSupplementary.push(sup.type)
      continue
    }

    const supParseResult = parseDat(supFetchResult.content)
    if (!supParseResult.ok) {
      failedSupplementary.push(sup.type)
      continue
    }

    const gamesMap = new Map<string, { comment: string; value: string }>()
    for (const game of supParseResult.dat.games) {
      if (game.comment) {
        const normalizedKey = game.comment.toLowerCase().trim()
        gamesMap.set(normalizedKey, {
          comment: game.comment,
          value: game.name,
        })
      }
    }

    supplementaryResults.push({
      type: sup.type,
      games: gamesMap,
    })
  }

  const enrichedGames = enrichGames(mainParseResult.dat.games, supplementaryResults)

  const mergedDat: DatFile = {
    header: mainParseResult.dat.header,
    games: enrichedGames,
  }

  return {
    ok: true,
    mainDat: mergedDat,
    supplementary: supplementaryResults,
  }
}

function enrichGames(
  games: DatGame[],
  supplementary: SupplementaryDatResult[]
): DatGame[] {
  const supplementaryMaps = {
    developer: buildSupplementaryMap(supplementary, 'developer'),
    genre: buildSupplementaryMap(supplementary, 'genre'),
    releaseyear: buildSupplementaryMap(supplementary, 'releaseyear'),
    releasemonth: buildSupplementaryMap(supplementary, 'releasemonth'),
    publisher: buildSupplementaryMap(supplementary, 'publisher'),
  }

  return games.map((game) => {
    const enrichedGame = { ...game }
    const baseGameName = extractBaseGameName(game.name)

    for (const rom of enrichedGame.roms) {
      const developerEntry = supplementaryMaps.developer.get(baseGameName)
      if (developerEntry) {
        rom.developer = developerEntry.value
      }

      const genreEntry = supplementaryMaps.genre.get(baseGameName)
      if (genreEntry) {
        rom.genre = genreEntry.value
      }

      const releaseyearEntry = supplementaryMaps.releaseyear.get(baseGameName)
      if (releaseyearEntry) {
        rom.releaseyear = releaseyearEntry.value
      }

      const releasemonthEntry = supplementaryMaps.releasemonth.get(baseGameName)
      if (releasemonthEntry) {
        rom.releasemonth = releasemonthEntry.value
      }

      const publisherEntry = supplementaryMaps.publisher.get(baseGameName)
      if (publisherEntry) {
        rom.publisher = publisherEntry.value
      }

      const region = parseRegion(game.name)
      if (region) {
        rom.region = region
      }
    }

    return enrichedGame
  })
}

function extractBaseGameName(gameName: string): string {
  const stripped = gameName.replace(/\s*\([^)]*\)/g, '').trim()
  return stripped.toLowerCase()
}

function buildSupplementaryMap(
  supplementary: SupplementaryDatResult[],
  type: 'developer' | 'genre' | 'releaseyear' | 'releasemonth' | 'publisher'
): Map<string, { comment: string; value: string }> {
  const found = supplementary.find((s) => s.type === type)
  return found ? found.games : new Map()
}

/**
 * @intent   Extract region from game name string using allowlist matching.
 * @guarantee Returns region string if found, null otherwise.
 * @constraint Only matches known regions from allowlist to avoid false positives.
 */
export function parseRegion(gameName: string): string | null {
  const parenthesisRegex = /\(([^)]+)\)/g
  const matches = gameName.matchAll(parenthesisRegex)

  const regions: string[] = []

  for (const match of matches) {
    const captured = match[1]
    if (!captured) continue

    const tokens = captured.split(',').map((t) => t.trim().toLowerCase())

    for (const token of tokens) {
      if (REGION_ALLOWLIST.has(token)) {
        const region = canonicalRegion(token)
        if (region && !regions.includes(region)) {
          regions.push(region)
        }
      }
    }
  }

  if (regions.length === 0) {
    return null
  }

  return regions.join(', ')
}

function canonicalRegion(token: string): string | null {
  const mapping: Record<string, string> = {
    us: 'USA',
    usa: 'USA',
    eu: 'Europe',
    europe: 'Europe',
    jp: 'Japan',
    japan: 'Japan',
    world: 'World',
    worldwide: 'World',
    uk: 'UK',
    'united kingdom': 'UK',
    au: 'Australia',
    australia: 'Australia',
    ca: 'Canada',
    canada: 'Canada',
    br: 'Brazil',
    brazil: 'Brazil',
    kr: 'Korea',
    korea: 'Korea',
    ru: 'Russia',
    russia: 'Russia',
    de: 'Germany',
    germany: 'Germany',
    fr: 'France',
    france: 'France',
    es: 'Spain',
    spain: 'Spain',
    it: 'Italy',
    italy: 'Italy',
    nl: 'Netherlands',
    netherlands: 'Netherlands',
    pl: 'Poland',
    poland: 'Poland',
    se: 'Sweden',
    sweden: 'Sweden',
    no: 'Norway',
    norway: 'Norway',
    dk: 'Denmark',
    denmark: 'Denmark',
    fi: 'Finland',
    finland: 'Finland',
    nz: 'New Zealand',
    'new zealand': 'New Zealand',
    za: 'South Africa',
    'south africa': 'South Africa',
    mx: 'Mexico',
    mexico: 'Mexico',
    ar: 'Argentina',
    argentina: 'Argentina',
    cl: 'Chile',
    chile: 'Chile',
    co: 'Colombia',
    colombia: 'Colombia',
    hk: 'Hong Kong',
    'hong kong': 'Hong Kong',
    tw: 'Taiwan',
    taiwan: 'Taiwan',
    sg: 'Singapore',
    singapore: 'Singapore',
    th: 'Thailand',
    thailand: 'Thailand',
    id: 'Indonesia',
    indonesia: 'Indonesia',
    my: 'Malaysia',
    malaysia: 'Malaysia',
    ph: 'Philippines',
    philippines: 'Philippines',
    in: 'India',
    india: 'India',
    il: 'Israel',
    israel: 'Israel',
    cn: 'China',
    china: 'China',
    asia: 'Asia',
  }

  return mapping[token] || token
}
