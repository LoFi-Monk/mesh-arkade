import pino from 'pino/browser'

/**
 * @intent Create a named, level-controlled logger instance for a given module or subsystem.
 * @guarantee Returns a Pino logger with the provided name bound to all output lines, defaulting to silent (no output).
 * @constraint Name should be a short kebab-case identifier (e.g. 'curator', 'fetch-manager'). Level must be 'silent', 'trace', 'debug', 'info', 'warn', 'error', or 'fatal'.
 */
export function createLogger (name: string, level: pino.LevelWithSilent = 'silent'): pino.Logger & { name: string; level: string } {
  const logger = pino({ name, level })
  return Object.assign(logger, { name, level })
}
