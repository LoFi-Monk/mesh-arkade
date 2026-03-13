# Design: Design System Infrastructure (Phase 1)

## Overview
This phase sets up the "Structural Skin" architecture without changing the current UI layout. It enables Tailwind and shadcn for future use while providing immediate "Quality of Life" improvements via Window Controls.

## Architecture
- **Theme Injection**: `tailwind.config.ts` will point to `src/index.css` and use CSS variables defined in `branding.ts`.
- **Registry Configuration**: `components.json` will register `@8bitcn` at `https://8bitcn.com/r/{name}.json` to allow component discovery.
- **8bit Baseline**: The `index.css` will be updated with 8bitcn's retro theme variables (e.g., `--retro-primary`) to provide a consistent aesthetic.
- **Window API**: Using the `pear-electron` `ui.app` methods to bridge React and the desktop runtime for window management.

## Component Strategy
- **WindowControls**: A floating or top-aligned component for desktop window management.
- **Status**: No other components will be refactored in this phase.
