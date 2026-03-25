import type { MeshStore, StoredRomEntry } from './types.js'
import type { DatFile, DatRom } from '../dat/types.js'
import type { StoreDatResult } from './types.js'

/**
 * @intent   Store a parsed DAT file in the Hyperbee store.
 * @guarantee On return, all ROMs are written with quad-hash key schema and cross-references.
 */
export async function storeDat(
  store: MeshStore,
  systemName: string,
  datFile: DatFile
): Promise<StoreDatResult> {
  await store.ready()

  const db = store.db.sub('dat').sub(systemName)

  let romCount = 0

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
  }

  return { ok: true, romCount }
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

  return entry
}
