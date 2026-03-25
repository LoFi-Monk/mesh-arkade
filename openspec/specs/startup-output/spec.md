### Requirement: App prints startup banner on boot
The system SHALL print `Mesh ARKade | A Decent Game Collection` to terminal output when the application starts. This output SHALL be produced via `console.log` directly, independent of the logger.

#### Scenario: Banner appears on normal startup
- **WHEN** the app is started via `pear run -d dist/`
- **THEN** `Mesh ARKade | A Decent Game Collection` is printed to terminal before any other output
