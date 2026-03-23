import test from 'brittle'
import { createLogger } from '../src/core/logger.js'

test('createLogger returns an object with standard log methods', (t) => {
  const logger = createLogger('test')
  t.is(typeof logger.info, 'function', 'has info method')
  t.is(typeof logger.error, 'function', 'has error method')
  t.is(typeof logger.warn, 'function', 'has warn method')
  t.is(typeof logger.debug, 'function', 'has debug method')
})

test('logger can create a named child logger', (t) => {
  const logger = createLogger('mesh-arkade')
  t.is(typeof logger.child, 'function', 'has child method for sub-loggers')
})
