# Mesh ARKade

A decentralized game preservation platform built on the [Pear Runtime](https://pears.com).

CLI-first. Agents and humans are equal users.

## Why

Myrient shut down on March 31, 2026. Before that, there was Vimm's Lair, and before that others. Centralized preservation services are fragile — someone has to pay the bills, and one day they can't.

Mesh ARKade is the answer to that pattern. Preservation that lives in the network, not on a server. DAT-verified, swarm-distributed, self-annealing. No single point of failure.

## What it does

Mesh ARKade is a headless preservation tool — it organizes, verifies, and distributes ROM archives over a P2P swarm. Verification is backed by No-Intro and Redump DAT files. The swarm is built on Hyperswarm. No centralized servers. No third-party dependencies.

## Status

Early development. Not ready for use.

## Tech Stack

- **Runtime:** Pear / Bare
- **P2P:** Hyperswarm + custom BitTorrent DHT
- **Local DB:** Hyperbee
- **Verification:** No-Intro + Redump DAT files

## License

MIT
