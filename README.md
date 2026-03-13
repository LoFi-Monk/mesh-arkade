# Mesh ARKade 🕹️

**A Decent... (Decentralized) Museum for Retro Preservation.**

Mesh ARKade is a peer-to-peer retro game preservation platform built on the **Pear Runtime**. It combines a high-performance headless core with a modern React-based GUI to provide a seamless experience for archivers and players alike.

## 🌟 Vision

Our mission is to create an **unstoppable, zero-infrastructure museum** for retro gaming. By leveraging P2P technology, we ensure that digital artifacts remain accessible without relying on central servers.

## 🚀 Features

- **Dual-Mode Architecture**: Run as a high-performance headless daemon (`--bare`) or a feature-rich desktop application.
- **P2P Core**: Built on Hypercore, Hyperswarm, and the Holepunch ecosystem.
- **Cellular Mounts**: Atomic discovery and indexing of ROM collections.
- **Sparse Sync**: Fetch-on-demand technology—download only the bytes you need to play.
- **Integrated Terminal**: Persistent CLI status footer and rich 8-bit ASCII aesthetics.

## 🛠️ Getting Started

### Prerequisites

- [Pear Runtime](https://pear.guide/)

### Installation

```bash
git clone https://github.com/LoFi-Monk/mesh-arkade.git
cd mesh-arkade
npm install
```

### Running

**GUI Mode (Default)**
```bash
pear run .
```

**Headless Mode (Bare)**
```bash
pear run . --bare
```

## ⌨️ CLI Commands

When running in Bare mode, the following commands are available:

- `help`: Display available commands and flags.
- `status`: Show Core Hub status (version, uptime, sockets).
- `quit` / `exit`: Safely shut down the Core Hub.

## 📂 Project Structure

- `index.js`: Dual-mode entry point (Electron/Bare).
- `src/core/`: Headless engine and P2P logic.
- `src/components/`: React UI components.
- `branding.ts`: Shared project identity and tagline engine.
- `.agent/`: Project management, roadmaps, and guidelines.

## 📜 License

Project is under active development.

---

*Part of the LoFi Monk preservation initiative.*
