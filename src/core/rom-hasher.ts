import * as fs from 'fs'
import * as crypto from 'crypto'
import CRC32 from 'crc-32'

/**
 * @intent   Stream a ROM file and compute CRC32 and SHA1 hashes in a single pass.
 * @guarantee On return, both crc32 and sha1 are uppercase hex strings; sha1 is 40 chars, crc32 is 8 chars.
 * @constraint File must exist and be readable. Throws if file does not exist.
 */
export async function hashRom(filePath: string): Promise<{ crc32: string; sha1: string }> {
  return new Promise((resolve, reject) => {
    const sha1Hash = crypto.createHash('sha1')
    let crc32Value = 0

    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk: Buffer) => {
      sha1Hash.update(chunk)
      crc32Value = CRC32.buf(chunk, crc32Value)
    })

    stream.on('end', () => {
      resolve({
        crc32: (crc32Value >>> 0).toString(16).toUpperCase().padStart(8, '0'),
        sha1: sha1Hash.digest('hex').toUpperCase(),
      })
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}
