import * as fs from 'fs'
import * as path from 'path'
import { hashRom } from './rom-hasher.js'
import { pathExists } from './runtime.js'

export interface ScannedFile {
  path: string
  crc32: string
  sha1: string
  verified: boolean
}

export interface ManifestData {
  collectionId: string
  scannedAt: number
  files: ScannedFile[]
}

export type HashAndMatchResult =
  | { crc32: string; sha1: string; verified: boolean }
  | null

/**
 * @intent   Non-blocking directory walker that yields file paths.
 * @guarantee Yields all file paths recursively under directory.
 * @constraint Returns empty async iterable if directory doesn't exist.
 */
export async function* walkDirectory(dirPath: string): AsyncGenerator<string> {
  if (!pathExists(dirPath)) {
    return
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath)
    } else if (entry.isFile()) {
      yield fullPath
    }
  }
}

/**
 * @intent   Hash a file and check if it exists in the catalog.
 * @guarantee Returns hash result with verified flag based on catalog lookup.
 * @constraint Returns null if file doesn't exist or hashing fails. O(1) lookup via Map.has().
 */
export async function hashAndMatch(
  filePath: string,
  catalog: Map<string, boolean>
): Promise<HashAndMatchResult> {
  if (!pathExists(filePath)) {
    return null
  }

  const hashResult = await hashRom(filePath)
  if (!hashResult.ok) {
    return null
  }

  const verified = catalog.has(hashResult.sha1) || catalog.has(hashResult.crc32)

  return {
    crc32: hashResult.crc32,
    sha1: hashResult.sha1,
    verified,
  }
}

/**
 * @intent   Write manifest.json atomically using .tmp file + rename.
 * @guarantee Returns true on success. On failure, no partial file is left.
 * @constraint Creates .mesh-arkade/ directory if it doesn't exist.
 */
export async function writeManifest(
  collectionPath: string,
  manifest: ManifestData
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const markerPath = path.join(collectionPath, '.mesh-arkade')

      if (!pathExists(markerPath)) {
        fs.mkdirSync(markerPath, { recursive: true })
      }

      const manifestPath = path.join(markerPath, 'manifest.json')
      const tempPath = manifestPath + '.tmp'

      const jsonContent = JSON.stringify(manifest, null, 2)
      fs.writeFileSync(tempPath, jsonContent, 'utf-8')
      fs.renameSync(tempPath, manifestPath)

      resolve(true)
    } catch {
      resolve(false)
    }
  })
}

/**
 * @intent   Scan a collection directory and verify files against catalog.
 * @guarantee Returns ManifestData with all scanned files and verification status.
 * @constraint Walks entire directory tree. Writes manifest to .mesh-arkade/.
 */
export async function scanCollection(
  collectionPath: string,
  collectionId: string,
  catalog: Map<string, boolean>
): Promise<ManifestData> {
  const files: ScannedFile[] = []

  for await (const filePath of walkDirectory(collectionPath)) {
    const relativePath = path.relative(collectionPath, filePath)
    const hashResult = await hashAndMatch(filePath, catalog)

    if (hashResult) {
      files.push({
        path: relativePath,
        crc32: hashResult.crc32,
        sha1: hashResult.sha1,
        verified: hashResult.verified,
      })
    }
  }

  const manifest: ManifestData = {
    collectionId,
    scannedAt: Date.now(),
    files,
  }

  await writeManifest(collectionPath, manifest)

  return manifest
}