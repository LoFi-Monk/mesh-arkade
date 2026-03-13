# Proposal: Unified Design System (Phase 1: Infrastructure)

## Motivation
To establish a scalable UI foundation that balances accessibility (shadcn/Radix) with the project's retro aesthetic (8bitcn). This phase focuses purely on installation, configuration, and low-risk utility components.

## Proposed Changes
- [NEW] Install and configure Tailwind CSS + PostCSS.
- [NEW] Initialize `shadcn/ui` v4 and configure `components.json`.
- [NEW] Register `@8bitcn` registry at `https://8bitcn.com/r/{name}.json`.
- [NEW] Install core 8bitcn components: `button`, `card`, `retro-mode-switcher`.
- [NEW] Inject 8bitcn theme variables into `src/index.css`.
- [NEW] Implement `WindowControls` (Min/Max/Close) utility component.

## Impact
- **Developer Experience**: Standardizes component creation.
- **Accessibility**: Lays the groundwork for Radix UI primitives.
- **Aesthetics**: Enables the "Accessible Museum" look via CSS variables.

## Verification
- Verify `npx shadcn-ui init` completes successfully.
- Verify `WindowControls` successfully call `ui.app` methods in the Pear runtime.
