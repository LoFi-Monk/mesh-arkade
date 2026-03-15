/**
 * @file dat-parser.ts
 * @description Pure functions for parsing DAT files (CLRMamePro and XML formats).
 */

/**
 * @intent Represents a single game entry parsed from a DAT file (CLRMamePro or XML format).
 * @guarantee name is always present; sha1, crc, and md5 are undefined when absent in the source DAT.
 */
export interface DatGame {
  name: string;
  sha1?: string;
  crc?: string;
  md5?: string;
}

/**
 * @intent Detects the DAT format from content and dispatches to the appropriate parser.
 * @guarantee Always returns an array — empty when no games are found; never throws.
 */
export function parseDat(content: string, systemId: string): DatGame[] {
  const trimmed = content.trim();
  if (
    trimmed.startsWith("clrmamepro") ||
    trimmed.slice(0, 100).includes("game (")
  ) {
    return parseClrmamepro(content, systemId);
  }
  return parseDatXml(content, systemId);
}

/**
 * @intent Extracts game records from CLRMamePro-format DAT content using regex block matching.
 * @guarantee Returns only entries with a valid name field; hash fields are present only when found in the source ROM entry.
 */
export function parseClrmamepro(content: string, _systemId: string): DatGame[] {
  const games: DatGame[] = [];
  const gameRegex = /\bgame\s*\(\s*(.*?)\n\s*\)/gs;
  let match;

  while ((match = gameRegex.exec(content)) !== null) {
    const block = match[1];
    const nameMatch = /\bname\s+"([^"]+)"/.exec(block);
    if (!nameMatch) continue;

    const gameEntry: DatGame = { name: nameMatch[1] };

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

/**
 * @intent Extracts game records from XML-format DAT content using regex element matching.
 * @guarantee Returns only entries with a parseable name attribute; hash fields are present only when found in the game block.
 */
export function parseDatXml(xmlContent: string, _systemId: string): DatGame[] {
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

/**
 * @intent Parses the first region or release-type identifier from a No-Intro game title's parenthetical suffix.
 * @guarantee Always returns a string; returns "Unknown" when no known region pattern matches.
 */
export function extractRegion(title: string): string {
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
