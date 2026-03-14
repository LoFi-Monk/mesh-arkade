import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectEnvironment } from "../environment";

describe("detectEnvironment", () => {
  beforeEach(() => {
    vi.stubGlobal("Pear", undefined);
  });

  it("should return development mode when Pear is missing", () => {
    const env = detectEnvironment();
    expect(env.mode).toBe("development");
    expect(env.isLocal).toBe(true);
  });

  it("should detect headless mode correctly", () => {
    vi.stubGlobal("Pear", {
      app: {
        args: ["--headless"],
        key: "some-key",
        dev: false
      }
    });
    const env = detectEnvironment();
    expect(env.mode).toBe("headless");
    expect(env.isHeadless).toBe(true);
  });

  it("should detect gui mode correctly", () => {
    vi.stubGlobal("Pear", {
      app: {
        args: [],
        key: "some-key",
        dev: false
      }
    });
    const env = detectEnvironment();
    expect(env.mode).toBe("gui");
    expect(env.isGui).toBe(true);
  });

  it("should detect flags correctly", () => {
    vi.stubGlobal("Pear", {
      app: {
        args: ["--json", "--silent"],
        key: "some-key",
        dev: true
      }
    });
    const env = detectEnvironment();
    expect(env.json).toBe(true);
    expect(env.silent).toBe(true);
    expect(env.isDev).toBe(true);
  });
});
