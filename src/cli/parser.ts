import type { ParsedArgs } from "./types.js";

/**
 * Tokenises a raw argument string into named flags and positional values.
 *
 * @intent Allow command handlers to receive a plain string and extract structured options without duplicating parsing logic.
 * @guarantee Returns a `ParsedArgs` object where `args` holds `--key[=value]` tokens and `positional` holds everything else; never throws.
 */
export function parseArgs(argsStr: string): ParsedArgs {
  const args: Record<string, string | boolean> = {};
  const trimmed = (argsStr || "").trim();
  if (!trimmed) return { args, positional: [] };

  const parts = trimmed.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith("--")) {
      const [key, value] = part.slice(2).split("=");
      args[key] = value ?? true;
    }
  }
  const positional = parts.filter((p) => !p.startsWith("--"));
  return { args, positional };
}

/**
 * Strips known application-level flags from the raw `process.argv` slice and returns the remaining tokens with parsed flag states.
 *
 * @intent Separate global flags (`--json`, `--silent`, `--headless`, `--help`) from command-specific tokens before dispatch.
 * @guarantee Returns an object with the filtered `remaining` array and boolean properties for each recognised flag; never throws.
 */
export function parseAppFlags(args: string[]): {
  remaining: string[];
  isJson: boolean;
  isSilent: boolean;
  isHeadless: boolean;
  hasHelp: boolean;
} {
  const appFlags = ["--silent", "--json", "--bare", "--headless", "--help"];
  const remaining = args.filter((a) => !appFlags.includes(a));
  return {
    remaining,
    isJson: args.includes("--json"),
    isSilent: args.includes("--silent"),
    isHeadless: args.includes("--bare") || args.includes("--headless"),
    hasHelp:
      args.includes("help") || args.includes("--help") || args.includes("-h"),
  };
}
