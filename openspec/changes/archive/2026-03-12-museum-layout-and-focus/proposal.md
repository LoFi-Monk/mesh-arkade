# Proposal: Museum Layout and Focus States (Phase 2)

## Motivation
Phase 1 established the the 8-bit infrastructure and core component set. Phase 2 moves up the hierarchy to implement the **Museum Layout**, which includes the primary navigation (`MuseumSidebar`) and the focus-state architecture required for upcoming Gamepad support (curator mode). This ensures that while we build a visually dense "Museum" UI, it remains accessible and navigable via keyboard/controller.

## Proposed Changes
- [NEW] Implement a custom `MuseumLayout` wrapper that integrates the `WindowControls` and the new sidebar.
- [NEW] Create `MuseumSidebar` using 8bitcn styled navigation items.
- [NEW] Establish a global Focus Ring style in Tailwind that matches the 8-bit aesthetic (high contrast, pixelated offset).
- [MODIFY] Update `App.tsx` to use the new `MuseumLayout`.
- [NEW] Implement `FocusScope` patterns for the landing screen components to ensure logical tab order.

## Impact
- **Navigation**: Provides a persistent structure for navigating between Exhibits (Games), Collection Scan, and Settings.
- **Accessibility**: Lays the critical foundation for roadmap [09] (Gamepad support).
- **Aesthetics**: Solidifies the "Museum" look with a structured layout.

## Verification
- Verify `MuseumSidebar` items are navigable via keyboard `Tab` keys.
- Verify focus rings are clearly visible and use the retro theme colors (Cyan/Magenta).
- Verify the layout is responsive and correctly handles the `WindowControls` padding.
