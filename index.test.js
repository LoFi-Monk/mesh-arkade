import { describe, it, expect, vi, beforeEach } from "vitest";

describe("index.js environment detection", () => {
  let mockPearApp;
  let mockPear;
  let detectEnvironment;

  beforeEach(() => {
    vi.resetModules();
  });

  const setupPearMocks = (appArgs = [], appKey = "test-key-123") => {
    mockPear = {
      app: {
        args: appArgs,
        key: appKey,
        dev: false,
      },
      teardown: vi.fn(),
    };
    globalThis.Pear = mockPear;
    return mockPear;
  };

  it("detects local development when Pear.app.key is null", async () => {
    setupPearMocks([], null);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("development");
    expect(env.isLocal).toBe(true);
  });

  it("detects --bare flag for headless mode", async () => {
    setupPearMocks(["--bare"]);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("bare");
    expect(env.isHeadless).toBe(true);
  });

  it("detects --headless flag for headless mode", async () => {
    setupPearMocks(["--headless"]);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("headless");
    expect(env.isHeadless).toBe(true);
  });

  it("detects GUI mode when key is present and no headless flags", async () => {
    setupPearMocks([], "real-key-123");
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("gui");
    expect(env.isGui).toBe(true);
  });

  it("detects --json flag for structured output", async () => {
    setupPearMocks(["--json"]);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.json).toBe(true);
  });

  it("detects --silent flag for silent mode", async () => {
    setupPearMocks(["--silent"]);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.silent).toBe(true);
  });

  it("combines multiple flags correctly", async () => {
    setupPearMocks(["--bare", "--json", "--silent"]);
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("bare");
    expect(env.isHeadless).toBe(true);
    expect(env.json).toBe(true);
    expect(env.silent).toBe(true);
  });

  it("defaults to GUI mode when in production", async () => {
    mockPear = {
      app: {
        args: [],
        key: "production-key",
        dev: false,
      },
      teardown: vi.fn(),
    };
    globalThis.Pear = mockPear;
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.mode).toBe("gui");
  });

  it("detects development mode via Pear.app.dev", async () => {
    mockPear = {
      app: {
        args: [],
        key: "test-key",
        dev: true,
      },
      teardown: vi.fn(),
    };
    globalThis.Pear = mockPear;
    const { detectEnvironment } = await import("../src/core/environment.js");
    const env = detectEnvironment();
    expect(env.isDev).toBe(true);
  });
});
