import type { CommandHandler, CommandOptions, CoreHub } from "../types.js";
import { output } from "../formatter.js";

/**
 * Command handler that reports the current application status via the `status` command.
 *
 * @intent Provide a quick health-check entry point that follows the standard `CommandHandler` interface.
 * @guarantee Delegates to `showStatus` with the provided options and mode; resolves immediately; never throws.
 */
export const handleStatus: CommandHandler = async (
  _argsStr: string,
  _hub: CoreHub,
  options: CommandOptions,
) => {
  showStatus(options, options.mode ?? "development");
};

/**
 * Constructs and emits a status report for the running application.
 *
 * @intent Allow both the `handleStatus` handler and other callers to print status without going through the full command dispatch path.
 * @guarantee Outputs a JSON object when `options.isJson` is true; otherwise prints a formatted plain-text status block; never throws.
 */
export function showStatus(
  options: CommandOptions,
  mode = "development",
): void {
  const status = {
    status: "ready",
    mode,
    version: "0.1.0",
    uptime:
      typeof process !== "undefined" && process.uptime ? process.uptime() : 0,
  };

  if (options.isJson) {
    output(status, options);
  } else {
    console.log(`
  Status:   ready
  Mode:     ${mode}
  Version:  0.1.0
`);
  }
}
