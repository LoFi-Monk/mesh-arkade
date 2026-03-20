// TOP OF FILE - MUST BE FIRST
const Module = require("module");
if (!Module.prototype.addon) {
  Module.prototype.addon = function () {
    return {};
  };
}

// Global require.addon
if (typeof require !== "undefined" && !(require as any).addon) {
  (require as any).addon = function () {
    return {};
  };
}

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global Bare mock as an EventEmitter
const { EventEmitter } = require("events");
const bareEmitter = new EventEmitter();
(globalThis as any).Bare = Object.assign(bareEmitter, {
  platform: "win32",
  arch: "x64",
  argv: [],
  exit: vi.fn(),
  suspend: vi.fn(),
  resume: vi.fn(),
  on: bareEmitter.on.bind(bareEmitter),
  removeListener: bareEmitter.removeListener.bind(bareEmitter),
});

// Mock individual bare-* packages by delegating to Node.js built-ins.
// This allows tests that mock the Node.js versions (like curator.test.ts)
// to have their mocks "pass through" if the implementation uses the bare-* versions.

vi.mock("bare-os", () => {
  return {
    get default() {
      return require("os");
    },
    get platform() {
      return require("os").platform;
    },
    get arch() {
      return require("os").arch;
    },
  };
});

vi.mock("bare-fs", () => {
  return {
    get default() {
      return require("fs");
    },
    // Add common exports that might be destructured
    get promises() {
      return require("fs").promises;
    },
    get existsSync() {
      return require("fs").existsSync;
    },
  };
});

vi.mock("bare-path", () => {
  return {
    get default() {
      return require("path");
    },
    get join() {
      return require("path").join;
    },
    get resolve() {
      return require("path").resolve;
    },
  };
});

vi.mock("bare-crypto", () => {
  return {
    get default() {
      return require("crypto");
    },
  };
});

vi.mock("bare-fetch", () => ({
  get default() {
    return globalThis.fetch;
  },
}));
vi.mock("bare-dns", () => ({ default: {} }));
vi.mock("bare-type", () => ({ default: {} }));

// Mock hyperswarm package for tests
vi.mock("hyperswarm", () => ({
  default: vi.fn().mockImplementation(() => {
    const events = require("events");
    const EventEmitter = events.EventEmitter;
    const emitter = new EventEmitter();
    return {
      ...emitter,
      join: vi
        .fn()
        .mockReturnValue({ flushed: vi.fn().mockResolvedValue(undefined) }),
      on: vi.fn(),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));
