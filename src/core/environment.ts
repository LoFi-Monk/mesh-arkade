/**
 * @file environment.ts
 * @description Environment detection for dual-mode entry point (GUI vs Bare/Terminal).
 */

/**
 * Describes the detected runtime environment.
 *
 * @intent Provide a unified interface for runtime context across GUI and Terminal modes.
 * @guarantee Properties are mutually exclusive where appropriate (e.g., isHeadless vs isGui).
 */
export interface Environment {
  /** The primary operating mode: development, bare, headless, or gui */
  mode: "development" | "bare" | "headless" | "gui";
  /** True when running locally without a provisioned app key */
  isLocal: boolean;
  /** True when running in headless mode (--bare or --headless flags) */
  isHeadless: boolean;
  /** True when running with GUI (Electron) */
  isGui: boolean;
  /** True when running in development mode */
  isDev: boolean;
  /** True when --json flag is present for structured output */
  json: boolean;
  /** True when --silent flag is present to suppress splash */
  silent: boolean;
}

/**
 * Pear runtime global type declaration.
 */
declare global {
  var Pear: {
    app: {
      args: string[];
      key: string | null;
      dev: boolean;
    };
    teardown: (fn: () => void | Promise<void>) => void;
  };
}

/**
 * Detects the current runtime environment based on Pear.app properties and CLI flags.
 *
 * @intent Determine whether to boot in GUI mode, headless terminal mode, or local development.
 * @guarantee Returns an Environment object with all properties correctly set.
 *            Never throws - missing Pear global defaults to safe fallback values.
 */
export function detectEnvironment(): Environment {
  const args = globalThis.Pear?.app?.args ?? [];
  const key = globalThis.Pear?.app?.key ?? null;
  const isDev = globalThis.Pear?.app?.dev ?? false;

  const hasFlag = (flag: string) => args.includes(flag);

  const isHeadless = hasFlag("--bare") || hasFlag("--headless");
  const isLocal = key === null;
  const isGui = !isHeadless && !isLocal;

  let mode: Environment["mode"] = "gui";
  if (isLocal) {
    mode = "development";
  } else if (hasFlag("--bare")) {
    mode = "bare";
  } else if (hasFlag("--headless")) {
    mode = "headless";
  }

  return {
    mode,
    isLocal,
    isHeadless,
    isGui,
    isDev,
    json: hasFlag("--json"),
    silent: hasFlag("--silent"),
  };
}
