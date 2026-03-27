import * as fs from 'fs'
import * as crypto from 'crypto'
import CRC32 from 'crc-32'
import type { HashRomResult } from '../store/types.js'

/**
 * @intent   Stream a ROM file and compute CRC32 and SHA1 hashes in a single pass.
 * @guarantee On return, both crc32 and sha1 are uppercase hex strings; sha1 is 40 chars, crc32 is 8 chars.
 * @constraint Throws nothing. Returns a Result object on any failure.
 */
export async function hashRom(filePath: string): Promise<HashRomResult> {
  return new Promise<HashRomResult>((resolve) => {
    const sha1Hash = crypto.createHash('sha1')
    let crc32Value = 0

    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk: Buffer) => {
      try {
        sha1Hash.update(chunk)
        crc32Value = CRC32.buf(chunk, crc32Value)
      } catch (err) {
        stream.destroy()
        resolve({
          ok: false,
          error: {
            type: 'file-error',
            message: err instanceof Error ? err.message : 'Unknown error during hashing',
          },
        })
      }
    })

    stream.on('end', () => {
      resolve({
        ok: true,
        crc32: (crc32Value >>> 0).toString(16).toUpperCase().padStart(8, '0'),
        sha1: sha1Hash.digest('hex').toUpperCase(),
      })
    })

    stream.on('error', (err) => {
      resolve({
        ok: false,
        error: {
          type: 'file-error',
          message: err.message,
        },
      })
    })
  })
}
