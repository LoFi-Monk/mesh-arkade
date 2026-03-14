/**
 * @file curation.ts
 * @description Curation Manager - handles DAT fetching, parsing, and wishlist management.
 */

import {
  getSystem,
  upsertSystem,
  insertWishlistBatch,
  searchWishlist as dbSearchWishlist,
  WishlistRecord,
  SystemRecord,
} from "./database.js";
let _fetch: any = null;

interface DatGame {
  name: string;
  sha1?: string;
  crc?: string;
  md5?: string;
}

/**
 * Represents a game system available for curation.
 *
 * @intent Provide a data structure for game system metadata.
 * @guarantee Contains id, title, and datUrl for system identification.
 */
export interface SystemDefinition {
  id: string;
  title: string;
  datUrl: string;
}

interface GitHubFile {
  name: string;
  download_url: string;
}

interface CachedSystems {
  systems: SystemDefinition[];
  timestamp: number;
}

const GITHUB_API_URL =
  "https://api.github.com/repos/libretro/libretro-database/contents/dat";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedSystems: SystemDefinition[] | null = null;
let cacheTimestamp: number = 0;

/**
 * Clears the cached systems list, forcing a fresh fetch on the next request.
 *
 * @intent Allow manual cache invalidation for testing or refresh scenarios.
 * @guarantee Subsequent fetchSystems calls will retrieve fresh data.
 */
export function clearSystemCache(): void {
  cachedSystems = null;
  cacheTimestamp = 0;
}

const SYSTEM_ALIASES: Record<string, string> = {
  "nintendo-entertainment-system": "nes",
  "super-nintendo-entertainment-system": "snes",
  "nintendo-64": "n64",
  "game-boy": "gb",
  "game-boy-color": "gbc",
  "game-boy-advance": "gba",
  "sega-master-system": "sms",
  "sega-game-gear": "gg",
  "sega-mega-drive": "md",
  "pc-engine": "pce",
  "turbo-grafx-16": "tg16",
  playstation: "psx",
  "atari-2600": "a2600",
  nes: "nes",
  snes: "snes",
  n64: "n64",
  gb: "gb",
  gbc: "gbc",
  gba: "gba",
  sms: "sms",
  gg: "gg",
  md: "md",
  pce: "pce",
  "nintendo entertainment system": "nes",
  "super nintendo entertainment system": "snes",
  "sega mega drive": "md",
  "game boy": "gb",
  "game boy color": "gbc",
  "game boy advance": "gba",
};

function normalizeSystemName(name: string): string {
  const lower = name.toLowerCase();
  const cleaned = lower
    .replace(/^nintendo - /, "")
    .replace(/^sega - /, "")
    .replace(/^sony /, "");
  return SYSTEM_ALIASES[cleaned] || cleaned;
}

function parseSystemIdFromFilename(filename: string): string {
  const name = filename.replace(/\.dat$/i, "").replace(/\.xml$/i, "");
  return normalizeSystemName(name);
}

async function fetchWithUserAgent(url: string): Promise<Response> {
  if (!_fetch) {
    if (typeof Bare !== "undefined") {
      _fetch = (await import("bare-fetch")).default;
    } else {
      _fetch =
        (globalThis as any).fetch || (await import("node-fetch")).default;
    }
  }

  const response = await _fetch(url, {
    headers: {
      "User-Agent": "mesh-arkade/v1.0.0",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error("GitHub API rate limit exceeded");
    }
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }
  return response;
}

/**
 * Fetches the list of available game systems from the Libretro database.
 *
 * @intent Retrieve available game systems from the remote DAT repository.
 * @guarantee Results are cached for 24 hours unless forceRefresh is true.
 *
 * @param forceRefresh - If true, bypasses cache and fetches fresh data.
 * @returns Array of SystemDefinition objects.
 */
export async function fetchSystems(
  forceRefresh = false,
): Promise<SystemDefinition[]> {
  const now = Date.now();

  if (!forceRefresh && cachedSystems && now - cacheTimestamp < CACHE_DURATION) {
    return cachedSystems;
  }

  try {
    const response = await fetchWithUserAgent(GITHUB_API_URL);
    const files: GitHubFile[] = await response.json();

    const systems: SystemDefinition[] = [];

    for (const file of files) {
      if (!file.name.match(/\.(dat|xml)$/i)) continue;

      const id = parseSystemIdFromFilename(file.name);
      const title = file.name.replace(/\.(dat|xml)$/i, "");

      systems.push({
        id,
        title,
        datUrl: file.download_url,
      });
    }

    cachedSystems = systems;
    cacheTimestamp = now;

    return systems;
  } catch (error) {
    if (cachedSystems) {
      return cachedSystems;
    }
    throw error;
  }
}

/**
 * Fetches and caches systems, bypassing any existing cache.
 *
 * @intent Force a refresh of the cached systems list.
 * @guarantee Returns fresh data from the remote repository.
 */
export async function fetchAndCacheSystems(): Promise<SystemDefinition[]> {
  return fetchSystems(true);
}

/**
 * Returns the cached systems list if available.
 *
 * @intent Provide access to cached systems without triggering a fetch.
 * @guarantee Returns null if systems have not been fetched yet.
 */
export function getCachedSystems(): SystemDefinition[] | null {
  return cachedSystems;
}

/**
 * Fetches systems and persists them to the database.
 *
 * @intent Populate the database with all available systems.
 * @guarantee Returns the systems that were successfully synced.
 */
export async function syncSystemsToDatabase(): Promise<SystemDefinition[]> {
  const systems = await fetchSystems();
  const db = await import("./database.js");

  for (const system of systems) {
    await db.upsertSystem({
      id: system.id,
      title: system.title,
      dat_url: system.datUrl,
      last_updated: new Date().toISOString(),
    });
  }

  return systems;
}

function getSystemDefinition(systemId: string): SystemDefinition | undefined {
  const cached = getCachedSystems();
  if (cached) {
    return cached.find(
      (s) =>
        s.id === systemId.toLowerCase() ||
        s.title.toLowerCase().includes(systemId.toLowerCase()),
    );
  }
  return undefined;
}

/**
 * Ensures a system exists in the database, fetching from remote if needed.
 *
 * @intent Guarantee a system is available before seeding or querying.
 * @guarantee Returns the SystemDefinition or throws if not found.
 *
 * @param systemId - The system identifier (e.g., "nes", "snes").
 * @returns The SystemDefinition for the requested system.
 * @throws Error if the system cannot be found.
 */
export async function ensureSystemExists(
  systemId: string,
): Promise<SystemDefinition> {
  let systemDef = getSystemDefinition(systemId);

  if (!systemDef) {
    await fetchSystems();
    systemDef = getSystemDefinition(systemId);
  }

  if (!systemDef) {
    const systems = await syncSystemsToDatabase();
    systemDef = systems.find((s) => s.id === systemId.toLowerCase());
  }

  if (!systemDef) {
    throw new Error(`System not found: ${systemId}`);
  }

  return systemDef;
}

async function fetchDat(url: string): Promise<string> {
  const response = await fetchWithUserAgent(url);
  return response.text();
}

function parseDat(content: string, systemId: string): DatGame[] {
  const trimmed = content.trim();
  if (
    trimmed.startsWith("clrmamepro") ||
    trimmed.slice(0, 100).includes("game (")
  ) {
    return parseClrmamepro(content, systemId);
  }
  return parseDatXml(content, systemId);
}

function parseClrmamepro(content: string, systemId: string): DatGame[] {
  const games: DatGame[] = [];
  // Match game ( ... ) blocks globally with /s for multiline
  const gameRegex = /\bgame\s*\(\s*(.*?)\n\s*\)/gs;
  let match;

  while ((match = gameRegex.exec(content)) !== null) {
    const block = match[1];
    const nameMatch = /\bname\s+"([^"]+)"/.exec(block);
    if (!nameMatch) continue;

    const gameEntry: DatGame = { name: nameMatch[1] };

    // Find rom info within the block - need to handle ) inside quoted strings
    const romRegex = /\brom\s*\(\s*((?:[^()"']|"[^"]*"|'[^']*')*)\s*\)/g;
    let romMatch;
    while ((romMatch = romRegex.exec(block)) !== null) {
      const romBlock = romMatch[1];
      const sha1Match = /\bsha1\s+([0-9a-fA-F]{40})\b/.exec(romBlock);
      if (sha1Match) gameEntry.sha1 = sha1Match[1].toLowerCase();

      const crcMatch = /\bcrc\s+([0-9a-fA-F]{8})\b/.exec(romBlock);
      if (crcMatch) gameEntry.crc = crcMatch[1].toUpperCase();

      const md5Match = /\bmd5\s+([0-9a-fA-F]{32})\b/.exec(romBlock);
      if (md5Match) gameEntry.md5 = md5Match[1].toLowerCase();
    }

    games.push(gameEntry);
  }

  return games;
}

function parseDatXml(xmlContent: string, systemId: string): DatGame[] {
  const games: DatGame[] = [];

  const gameRegex = /<game\s+name="([^"]+)"[^>]*>/g;
  let match;

  while ((match = gameRegex.exec(xmlContent)) !== null) {
    const gameName = match[1];
    const gameEntry: DatGame = { name: gameName };

    const gameBlockStart = match.index;
    const gameBlockEnd = xmlContent.indexOf("</game>", gameBlockStart);
    if (gameBlockEnd !== -1) {
      const gameBlock = xmlContent.slice(gameBlockStart, gameBlockEnd + 7);

      const sha1Match = /<sha1>([^<]+)<\/sha1>/.exec(gameBlock);
      if (sha1Match) gameEntry.sha1 = sha1Match[1];

      const crcMatch = /<crc>([^<]+)<\/crc>/.exec(gameBlock);
      if (crcMatch) gameEntry.crc = crcMatch[1];

      const md5Match = /<md5>([^<]+)<\/md5>/.exec(gameBlock);
      if (md5Match) gameEntry.md5 = md5Match[1];
    }

    games.push(gameEntry);
  }

  return games;
}

function extractRegion(title: string): string {
  const regionPatterns = [
    /\(USA\)/i,
    /\(Europe\)/i,
    /\(Japan\)/i,
    /\(World\)/i,
    /\(Rev [A-Z0-9]+\)/i,
    /\(Alt\b/i,
    /\(Beta\b/i,
    /\(Demo\b/i,
    /\(Proto\b/i,
  ];

  for (const pattern of regionPatterns) {
    const match = pattern.exec(title);
    if (match) {
      return match[0].replace(/[()]/g, "").trim();
    }
  }

  return "Unknown";
}

/**
 * Result of seeding a system with game data.
 *
 * @intent Provide structured output for seed operation results.
 * @guarantee Contains counts of games added and total available.
 */
export interface SeedResult {
  systemId: string;
  systemTitle: string;
  gamesAdded: number;
  totalGames: number;
}

/**
 * Result of a search query against the wishlist.
 *
 * @intent Provide structured output for search operation results.
 * @guarantee Contains game metadata including hashes and region.
 */
export interface SearchResult {
  title: string;
  sha1: string;
  crc: string;
  md5: string;
  region: string;
  system_id: string;
}

class CurationManagerClass {
  async seedSystem(
    systemId: string,
    onProgress?: (current: number, total: number) => void,
  ): Promise<SeedResult> {
    const systemDef = await ensureSystemExists(systemId);

    console.log(`Fetching DAT for ${systemDef.title}...`);
    const xmlContent = await fetchDat(systemDef.datUrl);
    console.log(`DAT Content Preview: ${xmlContent.slice(0, 500)}`);

    console.log(`Parsing DAT...`);
    const games = parseDat(xmlContent, systemId);
    const totalGames = games.length;

    await upsertSystem({
      id: systemId,
      title: systemDef.title,
      dat_url: systemDef.datUrl,
      last_updated: new Date().toISOString(),
    });

    const BATCH_SIZE = 100;
    let gamesAdded = 0;

    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const batch = games.slice(i, i + BATCH_SIZE);

      const records: WishlistRecord[] = batch.map((game) => ({
        system_id: systemId,
        title: game.name,
        sha1: game.sha1 || "",
        crc: game.crc || "",
        md5: game.md5 || "",
        region: extractRegion(game.name),
      }));

      await insertWishlistBatch(records);
      gamesAdded += records.length;

      if (onProgress) {
        onProgress(gamesAdded, totalGames);
      }
    }

    return {
      systemId,
      systemTitle: systemDef.title,
      gamesAdded,
      totalGames,
    };
  }

  async searchWishlist(
    query: string,
    systemId?: string,
    limit = 50,
  ): Promise<SearchResult[]> {
    const results = await dbSearchWishlist(query, systemId, limit);

    return results.map((r) => ({
      title: r.title,
      sha1: r.sha1,
      crc: r.crc,
      md5: r.md5,
      region: r.region,
      system_id: r.system_id,
    }));
  }

  async getSupportedSystems(): Promise<SystemDefinition[]> {
    return fetchSystems();
  }

  async getSystemInfo(systemId: string): Promise<SystemRecord | null> {
    return getSystem(systemId);
  }
}

/**
 * Returns the CurationManager singleton instance.
 *
 * @intent Provides access to curation operations for DAT parsing and wishlist management.
 * @guarantee Returns a new CurationManagerClass instance on each call.
 */
export function getCurationManager() {
  return new CurationManagerClass();
}
export default getCurationManager;
