import type { CommandHandler, CommandOptions, CoreHub } from "../types.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that registers a new library directory with the hub.
 *
 * @intent Allow users to add a ROM library path via the `mount <path>` command so its files are indexed.
 * @guarantee Resolves after printing mount confirmation or an error message; never throws.
 */
export const handleMount: CommandHandler = async (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  const path = argsStr.trim();

  if (!path) {
    if (options.isJson) {
      output({ error: "Missing path argument" }, options);
    } else {
      console.log("Usage: mount <path>");
    }
    return;
  }

  try {
    const result = await hub.handleRequest({
      method: "curator:mount",
      params: { path },
    });

    if (result.error) {
      error(result.error.message, options);
    } else {
      if (options.isJson) {
        output(result.result, options);
      } else {
        console.log(`Mounted: ${path}`);
        console.log(
          `  Files: ${(result.result as { fileCount: number }).fileCount}`,
        );
      }
    }
  } catch (err) {
    error((err as Error).message, options);
  }
};
