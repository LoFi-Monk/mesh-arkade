## ADDED Requirements

### Requirement: Logger is silent by default
The system SHALL suppress all log output unless explicitly enabled. The root logger SHALL be initialised with `level: 'silent'` when no debug flag is set.

#### Scenario: No log output on normal startup
- **WHEN** the app starts without `DEBUG=mesh-arkade` set
- **THEN** no JSON log lines are written to terminal

### Requirement: Debug output enabled via environment variable
The system SHALL output debug-level JSON log lines to terminal when `DEBUG=mesh-arkade` is set in the environment.

#### Scenario: Debug output on flagged startup
- **WHEN** the app starts with `DEBUG=mesh-arkade` set in the environment
- **THEN** log output at `debug` level and above is written to terminal as JSON lines

### Requirement: Root logger created at entry point
The system SHALL initialise a root Pino logger in `index.ts` using `createLogger` from `src/core/logger.ts` with name `'mesh-arkade'`.

#### Scenario: Logger initialised on startup
- **WHEN** the app starts
- **THEN** a named logger with `name: 'mesh-arkade'` is available for use by the entry point and subsystems
