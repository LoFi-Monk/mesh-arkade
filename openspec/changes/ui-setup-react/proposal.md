# Proposal: React UI & Branding Foundation

## Motivation

MeshARKade needs a premium, "accessible museum" UI. This milestone establishes the React + Vite toolchain within the Pear Runtime. This foundation allows us to build a rich, animated experience while keeping the P2P networking and archival logic isolated in the high-performance Bare runtime.

## Impact

- **Frontend**: Initializes a React + Vite project structure within `src/`.
- **Identity**: Creates a central `src/branding.ts` for consistent app-wide identity (MeshARKade).
- **Runtime**: Configures `pear-electron` and `pear-bridge` for our "Two-World" architecture.
- **Workflow**: Enables Hot Module Replacement (HMR) for rapid UI iteration.

## Proposed Changes

### [NEW] [branding.ts](file:///c:/ag-workspace/mesh-arkade/src/branding.ts)
- Stores `appName`, `tagline`, and primary/secondary colors.

### [NEW] [vite.config.ts](file:///c:/ag-workspace/mesh-arkade/vite.config.ts)
- Configures Vite to bundle React for Pear-Electron compat.

### [MODIFY] [index.js](file:///c:/ag-workspace/mesh-arkade/index.js)
- Bootstraps the Pear Runtime and Bridge to serve the React UI.

### [MODIFY] [package.json](file:///c:/ag-workspace/mesh-arkade/package.json)
- Adds React/Vite/Pear-Electron dependencies and scripts.
