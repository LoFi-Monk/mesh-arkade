import type { MeshStore, StoredRomEntry } from './types.js'
import type { DatFile, DatRom } from '../dat/types.js'
import type { StoreDatResult } from './types.js'

/**
 * @intent   Store a parsed DAT file in the Hyperbee store using quad-hash key schema.
 * @guarantee On return, all ROMs are indexed by SHA1, MD5, CRC, and SHA256 (where present); header is written.
 * @constraint systemName must be a canonical No-Intro/Libretro system name. Hash values are normalized to uppercase.
 */
export async function storeDat(
  store: MeshStore,
  systemName: string,
  datFile: DatFile
): Promise<StoreDatResult> {
  await store.ready()

  const db = store.db.sub('dat').sub(systemName)
  const nameIndex = db.sub('name')

  let romCount = 0

  // Note: Hyperbee doesn't have a clear() method, we need to delete entries individually
  const existingNames: string[] = []
  for await (const entry of nameIndex.createReadStream()) {
    existingNames.push(entry.key)
  }
  await Promise.all(existingNames.map((key) => nameIndex.del(key)))

  const headerKey = 'header'
  const headerValue = {
    name: datFile.header.name,
    version: datFile.header.version ?? null,
  }
  await db.put(headerKey, headerValue)

  for (const game of datFile.games) {
    for (const rom of game.roms) {
      const entry = createRomEntry(game.name, rom)
      romCount++

      if (rom.sha1) {
        const sha1Key = `sha1:${rom.sha1.toUpperCase()}`
        await db.put(sha1Key, entry)
      }

      if (rom.md5) {
        const md5Key = `md5:${rom.md5.toUpperCase()}`
        await db.put(md5Key, entry)
      }

      if (rom.crc) {
        const crcKey = `crc:${rom.crc.toUpperCase()}`
        await db.put(crcKey, entry)
      }

      if (rom.sha256) {
        const sha256Key = `sha256:${rom.sha256.toUpperCase()}`
        await db.put(sha256Key, entry)
      }
    }

    // Write name index entry once per game (using first ROM's CRC)
    const firstRom = game.roms[0]
    if (firstRom && firstRom.crc) {
      const normalizedName = normalizeName(game.name)
      const nameKey = normalizedName
      const nameValue = { crc: firstRom.crc.toUpperCase() }
      await nameIndex.put(nameKey, nameValue)
    }
  }

  return { ok: true, romCount }
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim()
}

function createRomEntry(gameName: string, rom: DatRom): StoredRomEntry {
  const entry: StoredRomEntry = {
    gameName,
    romName: rom.name,
    size: rom.size,
    crc: rom.crc?.toUpperCase() ?? null,
    md5: rom.md5?.toUpperCase() ?? null,
    sha1: rom.sha1?.toUpperCase() ?? null,
    sha256: rom.sha256?.toUpperCase() ?? null,
  }

  if (rom.serial) {
    entry.serial = rom.serial
  }

  if (rom.developer) {
    entry.developer = rom.developer
  }

  if (rom.genre) {
    entry.genre = rom.genre
  }

  if (rom.releaseyear) {
    entry.releaseyear = rom.releaseyear
  }

  if (rom.releasemonth) {
    entry.releasemonth = rom.releasemonth
  }

  if (rom.publisher) {
    entry.publisher = rom.publisher
  }

  if (rom.region) {
    entry.region = rom.region
  }

  return entry
}
