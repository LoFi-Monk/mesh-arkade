## ADDED Requirements

### Requirement: Centralized output formatting
A `src/cli/formatter.ts` module SHALL provide functions for outputting data in JSON or human-readable format based on `CommandOptions`.

#### Scenario: JSON output mode
- **WHEN** `output(data, { isJson: true })` is called
- **THEN** `JSON.stringify(data)` is printed to stdout

#### Scenario: Human-readable output mode
- **WHEN** `output(data, { isJson: false })` is called
- **THEN** a human-friendly representation is printed to stdout

### Requirement: Table formatting
The formatter SHALL provide a `table()` function for rendering tabular data.

#### Scenario: Table with rows
- **WHEN** `table(rows, { isJson: true })` is called
- **THEN** the rows are printed as a JSON array

#### Scenario: Table human-readable
- **WHEN** `table(rows, { isJson: false })` is called
- **THEN** the rows are printed as a formatted text table with column alignment

### Requirement: Error formatting
The formatter SHALL provide an `error()` function for consistent error output.

#### Scenario: Error in JSON mode
- **WHEN** `error("Not found", { isJson: true })` is called
- **THEN** `{"error": "Not found"}` is printed to stdout

#### Scenario: Error in human mode
- **WHEN** `error("Not found", { isJson: false })` is called
- **THEN** the error message is printed to stderr or stdout with clear error formatting

### Requirement: Commands use formatter instead of inline logic
All extracted command handlers SHALL use the formatter module for output instead of inline `if (isJson)` checks.

#### Scenario: Command uses formatter
- **WHEN** a command handler produces output
- **THEN** it calls formatter functions, not `console.log(JSON.stringify(...))` directly
