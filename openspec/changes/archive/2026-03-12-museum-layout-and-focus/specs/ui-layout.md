# Spec: Museum UI Layout

## Layout Dimensions
- **Sidebar Width**: 240px (expanded) / 64px (collapsed).
- **Header Height**: 32px (Window Controls area).
- **Content Padding**: 16px (pixel-aligned).

## Sidebar Navigation
The Sidebar must contain the following navigation items:
- **Exhibits**: Navigation to the game library.
- **Scanner**: Navigation to the DAT ingestion service.
- **Vault**: Navigation to the BIOS management area.
- **Settings**: Global app configurations.

## Visual Requirements
- **Borders**: All primary containers must use the 8-bit box border style from Phase 1.
- **Typography**: Sidebar labels must use the "Press Start 2P" font (size 8px-10px).
- **Active State**: The current route must be highlighted with a neon cyan background and black text (invert).

## Accessibility (Focus)
- **Tab Order**: 
    1. Window Controls (Minimize, Maximize, Close).
    2. Sidebar Items (Exhibits -> Scanner -> Vault -> Settings).
    3. Main Content buttons/cards.
- **Visibility**: Focus must never be lost; a 4px neon yellow offset ring must always indicate the active element.
