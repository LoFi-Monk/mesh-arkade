import type { CommandHandler, CommandOptions, CoreHub } from "../types.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that removes a mounted library directory from the hub's tracking list.
 *
 * @intent Allow users to detach a library path via the `unmount <path>` command when it is no longer needed.
 * @guarantee Resolves after printing confirmation or an error message; never throws.
 */
export const handleUnmount: CommandHandler = async (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  const path = argsStr.trim();

  if (!path) {
    if (options.isJson) {
      output({ error: "Missing path argument" }, options);
    } else {
      console.log("Usage: unmount <path>");
    }
    return;
  }

  try {
    const result = await hub.handleRequest({
      method: "curator:unmount",
      params: { path },
    });

    if (result.error) {
      error(result.error.message, options);
    } else {
      if (options.isJson) {
        output(result.result, options);
      } else {
        console.log(`Unmounted: ${path}`);
      }
    }
  } catch (err) {
    error((err as Error).message, options);
  }
};
