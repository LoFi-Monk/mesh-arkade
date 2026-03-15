import type {
  CommandHandler,
  CommandOptions,
  CoreHub,
  ReadlineInterface,
} from "../types.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that wipes all local metadata and database state after user confirmation.
 *
 * @intent Provide a safe recovery path for users who need to return the application to a clean state.
 * @guarantee In JSON mode the reset is executed immediately; in interactive mode a confirmation prompt is required before proceeding. Resolves after printing the outcome; never throws.
 */
export const handleReset: CommandHandler = async (
  _argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
  rl?: ReadlineInterface,
) => {
  if (options.isJson) {
    const result = await hub.handleRequest({
      method: "database:reset",
    });
    output(result.result || result.error, options);
    return;
  }

  if (!rl) {
    error("Readline interface required for interactive confirmation", options);
    return;
  }

  const confirm = await new Promise<string>((resolve) => {
    rl.question(
      "  WARNING: This will wipe all local metadata and databases. Proceed? (y/N): ",
      resolve,
    );
  });

  if (confirm.toLowerCase() === "y") {
    console.log("  Resetting system state...");
    try {
      const result = await hub.handleRequest({
        method: "database:reset",
      });
      if (result.error) {
        error(result.error.message, options);
      } else {
        console.log("  Success! System has been reset to a clean state.");
      }
    } catch (err) {
      error((err as Error).message, options);
    }
  } else {
    console.log("  Reset cancelled.");
  }
};
