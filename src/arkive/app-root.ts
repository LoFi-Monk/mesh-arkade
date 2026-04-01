import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const APP_DIR_NAME = 'mesh-arkade'

export interface AppConfig {
  version: string
  collections: Array<{
    uuid: string
    name: string
    path: string
  }>
}

/**
 * @intent   Get the path to the app root directory.
 * @guarantee Returns path to ~/mesh-arkade.
 * @constraint Uses os.homedir() via bare-node-os alias. customRoot bypasses home directory resolution entirely.
 */
export function getAppRootPath(customRoot?: string): string {
  const homeDir = os.homedir()
  return customRoot && customRoot !== '' ? customRoot : path.join(homeDir, APP_DIR_NAME)
}

/**
 * @intent   Initialize the app root directory structure.
 * @guarantee Creates directories and config file if they don't exist. Idempotent.
 * @constraint Safe to call on every startup. Does not overwrite existing config.json.
 */
export async function initAppRoot(customRoot?: string): Promise<void> {
  const appRoot = getAppRootPath(customRoot)
  const configPath = path.join(appRoot, 'config.json')

  await ensureDir(appRoot)

  if (!fileExists(configPath)) {
    const config: AppConfig = {
      version: '1.0.0',
      collections: [],
    }
    await writeFile(configPath, JSON.stringify(config, null, 2))
  }
}

/**
 * @intent   Read the current app config from config.json.
 * @guarantee Returns the parsed config object or null if file doesn't exist.
 * @constraint File must exist and be valid JSON.
 */
export function readConfig(customRoot?: string): AppConfig | null {
  const appRoot = getAppRootPath(customRoot)
  const configPath = path.join(appRoot, 'config.json')

  if (!fileExists(configPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as AppConfig
  } catch {
    return null
  }
}

/**
 * @intent   Update the app config by adding a collection entry.
 * @guarantee Adds collection to collections array and writes to config.json. Creates config if missing.
 * @constraint Throws on write failure.
 */
export function addCollectionToConfig(
  collection: { uuid: string; name: string; path: string },
  customRoot?: string
): void {
  const appRoot = getAppRootPath(customRoot)
  const configPath = path.join(appRoot, 'config.json')

  let config = readConfig(customRoot)

  if (!config) {
    config = { version: '1.0.0', collections: [] }
    ensureDirSync(appRoot)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    config = readConfig(customRoot)
  }

  if (config) {
    config.collections.push(collection)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } else {
    throw new Error('Failed to create config file')
  }
}

function ensureDirSync(dirPath: string): void {
  if (!fileExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * @intent   Remove a collection from the app config.
 * @guarantee Removes collection by UUID from collections array.
 * @constraint Config file must exist.
 */
export function removeCollectionFromConfig(uuid: string, customRoot?: string): void {
  const appRoot = getAppRootPath(customRoot)
  const configPath = path.join(appRoot, 'config.json')

  const config = readConfig(customRoot)
  if (!config) {
    return
  }

  config.collections = config.collections.filter((c) => c.uuid !== uuid)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

async function ensureDir(dirPath: string): Promise<void> {
  if (!fileExists(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

function fileExists(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

async function mkdir(dirPath: string, options: { recursive: boolean }): Promise<void> {
  await fs.promises.mkdir(dirPath, options)
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.writeFile(filePath, content, 'utf-8')
}
