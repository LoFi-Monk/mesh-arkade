import test from 'brittle'
import { createLogger } from '../src/core/logger.js'

test('wired logger has name: mesh-arkade and level: silent by default', (t) => {
  const logger = createLogger('mesh-arkade')
  t.is(logger.name, 'mesh-arkade', 'logger name is mesh-arkade')
  t.is(logger.level, 'silent', 'logger level is silent by default')
})