# Tasks: Museum Layout and Focus States

## 1. Infrastructure (Focus & Theme)
- [ ] 1.1 Define the `.retro-focus` utility in `src/index.css`.
- [ ] 1.2 Implement a `FocusProvider` (or similar pattern) to manage global focus states.

## 2. Component Development
- [ ] 2.1 Create the `MuseumSidebar` component in `src/components/MuseumSidebar.tsx`.
- [ ] 2.2 Add navigation items (Exhibits, Scanner, Vault, Settings) with 8-bit styling.
- [ ] 2.3 Implement the `MuseumLayout` wrapper in `src/components/MuseumLayout.tsx`.

## 3. Integration
- [ ] 3.1 Refactor `App.tsx` to use `MuseumLayout` as the root layout shell.
- [ ] 3.2 Ensure `WindowControls` are correctly positioned within the new layout.
- [ ] 3.3 Apply `FocusScope` to the `DiscoveryDeck` to verify navigation.

## 4. Verification
- [ ] 4.1 Verify keyboard navigation (Tab/Shift+Tab) across the sidebar and content.
- [ ] 4.2 Verify the visual styling of focus rings (Neon Yellow, pixel offset).
- [ ] 4.3 Verify responsive behavior of the sidebar (expanded/collapsed states).
