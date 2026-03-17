import { vi } from "vitest";

vi.mock("bare-type", () => ({
  type: (val: unknown): string => {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (Array.isArray(val)) return "array";
    return typeof val;
  },
  default: { type: (val: unknown): string => typeof val },
}));

vi.mock("bare-crypto", () => ({
  default: {
    createHash: (_algo: string) => ({
      update: (_data: unknown) => ({
        digest: (_encoding: string) => "mocked-hash",
      }),
    }),
  },
}));

import "@testing-library/jest-dom";

const originalRequire = typeof require !== "undefined" ? require : null;
if (originalRequire) {
  const originalAddon = originalRequire.addon;
  Object.defineProperty(originalRequire, "addon", {
    get: () => originalAddon,
    set: (val) => {
      console.log("Setting require.addon:", val);
    },
    configurable: true,
  });
}
