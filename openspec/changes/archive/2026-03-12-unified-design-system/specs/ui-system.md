# Specification: Design System Components

## Overview
This specification defines the behavior and properties of the Unified Design System components.

## 🎨 Design Tokens
The following tokens must be ingested from `src/branding.ts` and made available as CSS variables:
- `--color-primary`
- `--color-secondary`
- `--font-retro` (e.g., Press Start 2P)
- `--font-modern` (e.g., Inter/System)

## 🍱 Component Guidelines

### 1. Button (8-bit Variant)
- **Base**: `shadcn` Button primitive.
- **Style**: Pixel-border (8bitcn), primary/secondary color mapping.
- **Accessibility**: Must support `:focus-visible` states with high-contrast outlines.

### 2. Sidebar (Museum Layout)
- **Structure**: `shadcn` Sidebar pattern.
- **Theme**: Collapsible with retro icons.
- **Accessibility**: Proper ARIA landmark roles (`nav`, `aside`).

### 3. Box / Card (Retro Container)
- **Style**: Classic 8-bit box-shadow and border-image.
- **Usage**: Primary container for game info and cards.

## ⚖️ Accessibility Standards
- **ARIA**: All interactive elements must have semantic roles and labels.
- **Keyboard**: Full navigation support (Escape to close, Tab to cycle, Enter to select).
- **Contrast**: Text/Background contrast must meet WCAG AA (4.5:1) minimum for readability.
