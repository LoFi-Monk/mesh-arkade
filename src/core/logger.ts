import pino from 'pino/browser'

/**
 * @intent Create a named logger instance for a given module or subsystem.
 * @guarantee Returns a Pino logger with the provided name bound to all output lines.
 * @constraint Name should be a short kebab-case identifier (e.g. 'curator', 'fetch-manager').
 */
export function createLogger (name: string, level: string = 'silent'): pino.Logger & { name: string; level: string } {
  const logger = pino({ name, level })
  return Object.assign(logger, { name, level })
}
