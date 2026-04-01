// @ts-expect-error - compat.js is a plain JS module that sets globals
await import('./compat.js')
import * as path from 'path'
import { createLogger } from './src/core/logger.js'
import { createStore } from './src/store/store.js'
import { ArkiveService, initAppRoot, IdentityServiceImpl } from './src/arkive/index.js'

/**
 * @intent Provide the root application logger for mesh-arkade.
 * @guarantee Silent by default; activates at debug level when DEBUG=mesh-arkade is set.
 * @constraint Do not use this logger in library modules — pass a child logger via createLogger instead.
 */
export const logger = createLogger('mesh-arkade', process.env.DEBUG === 'mesh-arkade' ? 'debug' : 'silent')

const { versions } = Pear
console.log('Mesh ARKade | A Decent Game Collection')
console.log('Pear terminal application running')
console.log(await versions())

const NES_SYSTEM = 'Nintendo - Nintendo Entertainment System'

async function main() {
  await initAppRoot()

  const store = createStore()
  Pear.teardown(() => store.close())
  const identity = new IdentityServiceImpl(store)
  const arkive = new ArkiveService({ store, identity })

  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'catalog': {
        const titles = await arkive.listTitles({ system: 'nes' })
        console.log('NES Catalog:')
        for (const title of titles) {
          console.log(`  ${title.name} [${title.crc}]`)
        }
        break
      }

      case 'search': {
        const query = args[1]
        if (!query) {
          console.error('Usage: search <query>')
          process.exit(1)
        }
        const results = await arkive.searchByName({ system: 'nes', query })
        console.log(`Search results for "${query}":`)
        for (const title of results) {
          console.log(`  ${title.name} [${title.crc}]`)
        }
        break
      }

      case 'info': {
        const crc = args[1]
        if (!crc) {
          console.error('Usage: info <crc>')
          process.exit(1)
        }
        if (!/^[0-9a-fA-F]{8}$/.test(crc)) {
          console.error('Invalid CRC: must be 8-character hex string')
          process.exit(1)
        }
        const entry = await arkive.getTitle('nes', crc)
        if (entry) {
          console.log('Title Info:')
          console.log(`  Game: ${entry.gameName}`)
          console.log(`  ROM: ${entry.romName}`)
          console.log(`  Size: ${entry.size}`)
          console.log(`  CRC: ${entry.crc}`)
          if (entry.region) console.log(`  Region: ${entry.region}`)
          if (entry.developer) console.log(`  Developer: ${entry.developer}`)
          if (entry.genre) console.log(`  Genre: ${entry.genre}`)
          if (entry.releaseyear) console.log(`  Year: ${entry.releaseyear}`)
          if (entry.publisher) console.log(`  Publisher: ${entry.publisher}`)
        } else {
          console.log('Title not found')
        }
        break
      }

      case 'refresh': {
        console.log('Refreshing NES catalog...')
        await arkive.refreshCatalog(NES_SYSTEM)
        console.log('Catalog refreshed!')
        break
      }

      case 'collection': {
        const subcommand = args[1]
        switch (subcommand) {
          case 'add': {
            const collectionPath = args[2]
            if (!collectionPath) {
              console.error('Usage: collection add <path> [name]')
              process.exit(1)
            }
            const absolutePath = path.resolve(collectionPath)
            const collectionName = args[3] ?? path.basename(absolutePath)
            const result = await arkive.addCollection({ name: collectionName, path: absolutePath })
            console.log(`Collection added: ${result.name} (${result.id})`)
            break
          }

          case 'list': {
            const rootPath = args[2]
            const collections = await arkive.listCollections({ rootPath: rootPath ?? '' })
            if (collections.length === 0) {
              console.log('No collections found')
            } else {
              console.log('Collections:')
              for (const col of collections) {
                const status = col.connected ? 'connected' : 'disconnected'
                console.log(`  ${col.name} [${col.id}] (${status})`)
              }
            }
            break
          }

          case 'scan': {
            const collectionId = args[2]
            if (!collectionId) {
              console.error('Usage: collection scan <collection-id>')
              process.exit(1)
            }
            if (!/^[0-9a-fA-F]{32}$/.test(collectionId)) {
              console.error('Invalid collection ID: must be a 32-character hex string')
              process.exit(1)
            }
            console.log('Scanning collection...')
            await arkive.scanCollection({ collectionId })
            console.log('Scan complete!')
            break
          }

          default:
            console.error('Usage: collection <add|list|scan> [options]')
            process.exit(1)
        }
        break
      }

      case 'help':
      case undefined:
      case '':
        console.log(`
Mesh ARKade Commands:
  catalog              List all NES titles
  search <query>       Search for titles by name
  info <crc>          Get title info by CRC
  refresh              Refresh the NES catalog
  collection add <path> [name]    Add a collection
  collection list [path]         List collections
  collection scan <id>           Scan a collection
  help                 Show this help message
        `)
        break

      default:
        console.log(`Unknown command: ${command}`)
        console.log('Run "help" for available commands')
        process.exit(1)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
