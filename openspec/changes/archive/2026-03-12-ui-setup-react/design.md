# Design: React UI & Branding Foundation

## Context

We are building a P2P retro game museum. The UI must be high-performance and visually stunning (Black, Gray, White aesthetic). We use `pear-electron` as our desktop runtime and `pear-bridge` to connect the Bare P2P process to the Chromium renderer.

## Solution

### The "Two-World" Architecture

1.  **Main Process (Bare JS)**:
    - Runs `index.js`.
    - Manages the Pear Runtime and `pear-bridge`.
    - Handles future P2P logic (Hyperswarm).
2.  **Renderer Process (Chromium/React)**:
    - Bootstrapped by Vite.
    - Consumes UI components and displays data from the Bare process.

### Toolchain Integration

- **Development**: Vite provides a dev server at `localhost:5173`. The `pear-bridge` points to this URL during `pear run --dev .` to enable HMR.
- **Production/Staging**: Vite bundles assets into `dist/`. The `pear-bridge` serves files from this directory.
- **Branding**: A single source of truth in `src/branding.ts` ensures that the "MeshARKade" identity is consistent and easy to update.

## Risks & Mitigations

- **IPC Overhead**: Communication via the bridge can be a bottleneck.
  - *Mitigation*: We will move towards a "Local Streaming Bridge" pattern for large assets (ROMs/Cores) in later milestones.
- **Build Drift**: Ensuring Vite builds work correctly inside Pear's sandbox.
  - *Mitigation*: we use the `pear-electron/pre` script and explicit static analysis entrypoints.
