# Tasks: Design System Infrastructure

## 1. Environment Setup
- [x] 1.1 Install dependencies: `npm install -D tailwindcss postcss autoprefixer shadcn`
- [x] 1.2 Initialize shadcn v4: `npx shadcn@latest init` (Select 'Radix' and defaults).
- [x] 1.3 Register 8bitcn: Add `@8bitcn` to `components.json` registries.
- [x] 1.4 Install 8bitcn UI: `npx shadcn@latest add @8bitcn/button @8bitcn/card @8bitcn/retro-mode-switcher`

## 2. Global Styles (8-bit Baseline)
- [x] 2.1 Update `src/index.css` with 8bitcn baseline retro variables and Radix resets.
- [x] 2.2 Create `src/lib/branding.ts` to export shared theme tokens.

## 3. Utility Components (Low-Risk)
- [x] 3.1 Implement `src/components/WindowControls.tsx` using `Pear.ui.app` API.
- [x] 3.2 Integrate `WindowControls` into the main application layout.

## 4. Verification
- [x] 4.1 Verify `npm run dev` launches without shadcn/tailwind errors.
- [x] 4.2 Verify `WindowControls` buttons successfully control the Pear window.
- [x] 4.3 Verify core branding and descriptors via unit tests (npm test).
