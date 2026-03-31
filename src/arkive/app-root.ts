import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const APP_DIR_NAME = 'mesh-arkade'

/**
 * @intent   Get the path to the app root directory.
 * @guarantee Returns path to ~/mesh-arkade.
 */
export function getAppRootPath(customRoot?: string): string {
  const homeDir = os.homedir()
  return customRoot ?? path.join(homeDir, APP_DIR_NAME)
}

/**
 * @intent   Initialize the app root directory structure.
 * @guarantee Creates directories and config file if they don't exist. Idempotent.
 */
export async function initAppRoot(customRoot?: string): Promise<void> {
  const appRoot = getAppRootPath(customRoot)
  const datsDir = path.join(appRoot, 'DATs')
  const configPath = path.join(appRoot, 'config.json')

  await ensureDir(appRoot)
  await ensureDir(datsDir)

  if (!fileExists(configPath)) {
    const config = {
      version: '1.0.0',
      collections: [],
    }
    await writeFile(configPath, JSON.stringify(config, null, 2))
  }
}

/**
 * @intent   Save raw DAT content to the DATs cache directory.
 * @guarantee Writes file to DATs/<system>.dat.
 */
export async function saveDatCache(systemName: string, content: string, customRoot?: string): Promise<void> {
  const appRoot = getAppRootPath(customRoot)
  const datsDir = path.join(appRoot, 'DATs')

  await ensureDir(datsDir)

  const safeName = systemName.replace(/[^a-zA-Z0-9 -]/g, '_')
  const filePath = path.join(datsDir, `${safeName}.dat`)

  await writeFile(filePath, content)
}

async function ensureDir(dirPath: string): Promise<void> {
  if (!fileExists(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
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
