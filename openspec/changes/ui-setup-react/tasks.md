# Implementation Tasks: React UI & Branding Foundation

## 0. MANDATORY CONTEXT GATHERING

- [x] 0.1 READ EVERYTHING in `.agent/skills/pear-runtime/` to understand the Bare/Electron architecture.
- [x] 0.2 Ask DeepWiki: "What are the common pitfalls when using pear-bridge with Vite HMR in Pear-Electron?"
- [x] 0.3 Verify that `pear-electron/pre` is correctly referenced in `package.json`.

## 1. Project Scaffolding

- [x] 1.1 Install dependencies: `npm install react react-dom pear-electron pear-bridge`.
- [x] 1.2 Install dev dependencies: `npm install -D vite @vitejs/plugin-react @types/react @types/react-dom`.
- [x] 1.3 Create `src/branding.ts` with the "MeshARKade" identity, colors, and all archival word categories.

## 2. Vite & React Setup

- [x] 2.1 Create `vite.config.ts` with React plugin and appropriate base paths for Pear.
- [x] 2.2 Create `src/main.tsx` and `src/App.tsx`.
- [x] 2.3 Create `index.html` at the project root pointing to `src/main.tsx`.

## 3. Pear Integration (Bare Process)

- [x] 3.1 Update `index.js` to initialize `pear-electron` and `pear-bridge`.
- [x] 3.2 Implement logic to serve the Vite dev server during development (`process.env.NODE_ENV === 'development'`).
- [x] 3.3 Ensure the bridge correctly serves `dist/` for production.

## 4. Initial Component & Verification

- [x] 4.1 Create a simple `Welcome` component (DiscoveryDeck) using colors from `branding.ts`.
- [x] 4.2 Create a Vitest unit test for the `Welcome` component.
- [x] 4.3 Verify the build using `npm run build:ui`.
- [x] 4.4 Verify the app launch using `pear run --dev .`.
