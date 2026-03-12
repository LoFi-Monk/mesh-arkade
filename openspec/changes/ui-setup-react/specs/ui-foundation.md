# Specification: UI & Branding Foundation

## Requirements

### Requirement: Central Branding Identity
- **GIVEN** The file `src/branding.ts`.
- **WHEN** Exporting constants.
- **THEN** It must contain:
  - `appName`: "MeshARKade"
  - `primaryTagline`: "A Decent Game Preserve"
  - `taglines`: `["Play it Forward", "Seed the Archive", "The Games Remain"]`
  - `categories`: `{ archival: [...], museum: [...], organic: [...], digital: [...], scene: [...] }`
  - `colors`: `{ primary: 'Black', secondary: 'Gray', accent: 'White' }`

### Requirement: Two-World Bridge Setup
- **GIVEN** A running Bare process and an Electron renderer.
- **WHEN** Initializing `pear-bridge`.
- **THEN** It must correctly route requests:
  - Development: `http://localhost:5173`
  - Production: `./dist/`

### Requirement: Build System (Vite)
- **GIVEN** The `package.json` scripts.
- **WHEN** Running `npm run build:ui`.
- **THEN** It must produce a production-ready bundle in `dist/` that `pear stage` can ingest.

### Requirement: React Component Standards
- **GIVEN** A React component (e.g., `Welcome.tsx`).
- **WHEN** Written in TypeScript.
- **THEN** It must include TSDoc comments and follow the "Accessible Museum" naming convention (e.g., `PreservationRoom`, `DiscoveryDeck`).
