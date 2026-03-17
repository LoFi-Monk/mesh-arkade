# Context Index

This file is the map for AutoMaker agents. External docs live in `docs/` — follow the paths below to find what you need.

## Engineering Standards

Read this before writing any code: `engineering-standards.md`

Covers: TDD, TypeScript (no `any`), TSDoc shape, SOLID/DRY, Bare runtime compatibility, git discipline, linting, and pre-commit hooks.

## Architecture Decision Records

Decisions that are final. Do not re-propose alternatives without new evidence.

| # | Decision | File |
|---|----------|------|
| 0001 | Use MADR format for tracking architecture decisions | `docs/adr/0001-adr-standard.md` |
| 0002 | Hyperbee chosen over SQLite for metadata storage (Bare-friendly, P2P-portable) | `docs/adr/0002-hyperbee-metadata-storage.md` |

## Reference Docs

**If your task involves any of these, fetch the README before implementing.**

`docs.pears.com` lags reality — prefer `pear-docs` for platform concepts and individual module READMEs for API details.

| Module | README |
|--------|--------|
| **Pear Platform Docs** (start here) | https://github.com/holepunchto/pear-docs |
| Pear Runtime (platform) | https://github.com/holepunchto/pear |
| Hyperswarm (P2P networking) | https://github.com/holepunchto/hyperswarm |
| Hyperbee (key-value DB) | https://github.com/holepunchto/hyperbee |
| Hypercore (append-only log) | https://github.com/holepunchto/hypercore |
| Corestore (multi-core manager) | https://github.com/holepunchto/corestore |
| pear-electron (desktop GUI) | https://github.com/holepunchto/pear-electron |
| bare-crypto | https://github.com/holepunchto/bare-crypto |
| bare-fs | https://github.com/holepunchto/bare-fs |
