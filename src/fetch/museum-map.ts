/**
 * @file museum-map.ts
 * @description Museum Map module for resolving SHA1 hashes to IPFS CIDs.
 */

import museumMapData from "./museum-map.json";

interface MuseumMapMapping {
  [sha1: string]: string;
}

interface MuseumMapData {
  $schema: string;
  description: string;
  version: number;
  mappings: MuseumMapMapping;
}

const museumMap: MuseumMapData = museumMapData as MuseumMapData;

/**
 * @intent Looks up an IPFS CID by SHA1 hash from the Museum Map.
 * @guarantee Returns the CID string if found, or null if the SHA1 is not in the map.
 * @param sha1 The full 40-character SHA1 hash to look up.
 */
export function lookupCid(sha1: string): string | null {
  const normalizedSha1 = sha1.toLowerCase();
  return museumMap.mappings[normalizedSha1] ?? null;
}

/**
 * @intent Returns the Museum Map version.
 * @guarantee Returns the current version number of the map.
 */
export function getMuseumMapVersion(): number {
  return museumMap.version;
}
