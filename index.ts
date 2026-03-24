import { createLogger } from './src/core/logger.js'

console.log('Mesh ARKade | A Decent Game Collection')

export const logger = createLogger('mesh-arkade', process.env.DEBUG === 'mesh-arkade' ? 'debug' : 'silent')

const { versions } = Pear
console.log('Pear terminal application running')
console.log(await versions())
