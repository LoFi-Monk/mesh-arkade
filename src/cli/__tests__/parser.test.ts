import { describe, it, expect } from "vitest";
import { parseArgs, parseAppFlags } from "../parser.js";

describe("parseArgs", () => {
  it("should parse empty string", () => {
    const result = parseArgs("");
    expect(result).toEqual({ args: {}, positional: [] });
  });

  it("should parse string with only positional args", () => {
    const result = parseArgs("mario world");
    expect(result).toEqual({ args: {}, positional: ["mario", "world"] });
  });

  it("should parse --flag format", () => {
    const result = parseArgs("--json --silent");
    expect(result).toEqual({
      args: { json: true, silent: true },
      positional: [],
    });
  });

  it("should parse --flag=value format", () => {
    const result = parseArgs("--seed=nes --limit=10");
    expect(result).toEqual({
      args: { seed: "nes", limit: "10" },
      positional: [],
    });
  });

  it("should mix flags and positional args", () => {
    const result = parseArgs("--seed=nes super mario");
    expect(result).toEqual({
      args: { seed: "nes" },
      positional: ["super", "mario"],
    });
  });

  it("should handle --system without value", () => {
    const result = parseArgs("--system");
    expect(result).toEqual({ args: { system: true }, positional: [] });
  });

  it("should handle complex query", () => {
    const result = parseArgs('--system=nes "super mario"');
    expect(result).toEqual({
      args: { system: "nes" },
      positional: ['"super', 'mario"'],
    });
  });

  it("should filter out flag-like positional args", () => {
    const result = parseArgs("--json some arg --another");
    expect(result.args.json).toBe(true);
    expect(result.positional).toContain("some");
    expect(result.positional).toContain("arg");
  });
});

describe("parseAppFlags", () => {
  it("should extract app flags", () => {
    const result = parseAppFlags(["--silent", "--json", "search", "mario"]);
    expect(result).toEqual({
      isJson: true,
      isSilent: true,
      isHeadless: false,
      hasHelp: false,
      remaining: ["search", "mario"],
    });
  });

  it("should detect --bare as headless", () => {
    const result = parseAppFlags(["--bare", "--silent", "systems"]);
    expect(result).toEqual({
      isJson: false,
      isSilent: true,
      isHeadless: true,
      hasHelp: false,
      remaining: ["systems"],
    });
  });

  it("should detect --headless as headless", () => {
    const result = parseAppFlags(["--headless", "init", "--seed=nes"]);
    expect(result).toEqual({
      isJson: false,
      isSilent: false,
      isHeadless: true,
      hasHelp: false,
      remaining: ["init", "--seed=nes"],
    });
  });

  it("should detect help flags", () => {
    const result = parseAppFlags(["--help"]);
    expect(result.hasHelp).toBe(true);
  });

  it("should detect help command", () => {
    const result = parseAppFlags(["help"]);
    expect(result.hasHelp).toBe(true);
  });

  it("should handle empty array", () => {
    const result = parseAppFlags([]);
    expect(result).toEqual({
      isJson: false,
      isSilent: false,
      isHeadless: false,
      hasHelp: false,
      remaining: [],
    });
  });
});
