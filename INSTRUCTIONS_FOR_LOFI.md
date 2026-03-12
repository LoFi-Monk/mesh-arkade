# 🎮 Instructions for LoFi Monk

Welcome to the **MeshARKade** decentralized museum! This project uses a "Two-World" architecture:
1. **Bare JS**: The engine for P2P, swarms, and files.
2. **React + Vite**: The premium, animated user interface.

## 🚀 How to Run (Development)

To get the most out of our "on-rails" setup, you should use **Hot Module Replacement (HMR)**. This allows you to see UI changes instantly.

### Option A: The "One Terminal" Way (Recommended)
I have set up a single command that starts the Vite UI server AND the Pear window at the same time:
```powershell
npm run dev
```

### Option B: The "Two Terminal" Way (Fine-grained control)
1. **Terminal 1**: `npm run dev:ui` (Starts the React server)
2. **Terminal 2**: `pear run --dev .` (Starts the Pear window)

## 🎨 Branding & Identity
Our identity is kept in **`src/branding.ts`**.
- Change the `appName` or `tagline` there.
- You'll see the UI update **instantly** if the app is running.

## 🧪 Testing & Quality
- **Run Tests**: `npm test`
- **Typecheck**: `npm run typecheck`
- **Build Production**: `npm run build:ui` (Creates the `dist/` folder)

## 🛡️ CTO Guardian Safeword
If you suggest something that breaks the Pear architecture, I will use the safeword:
**"Timeout! ⏰"** 
This means we need to stop and realign with P2P best practices.

---
*Created on: 2026-03-12*
