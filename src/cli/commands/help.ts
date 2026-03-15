import type { CommandHandler, CommandOptions } from "../types.js";
import { output } from "../formatter.js";

const helpText = {
  commands: {
    help: "Display this help message",
    status: "Show Core Hub status",
    mount: "Mount a library directory",
    unmount: "Unmount a library directory",
    "list-mounts": "List all mounted libraries (alias: mounts)",
    systems: "List all supported game systems (fetching from GitHub)",
    init: "Initialize/seeding system DATs (use: init --seed <system>)",
    search: "Search wishlist database (use: search <query>)",
    reset: "Wipe all local database and storage state",
    quit: "Exit the application",
    exit: "Exit the application",
  },
  flags: {
    "--bare": "Run in headless terminal mode",
    "--headless": "Run in headless mode (alias for --bare)",
    "--json": "Output in JSON format",
    "--silent": "Suppress splash screen",
    "--help": "Display help (same as running 'help' command)",
  },
};

/**
 * Prints the full command and flag reference to stdout.
 *
 * @intent Give users a quick reference to all available commands and flags without leaving the application.
 * @guarantee Outputs structured JSON when `options.isJson` is true; otherwise prints a formatted plain-text usage block.
 */
export function showHelp(options: CommandOptions): void {
  if (options.isJson) {
    output(helpText, options);
  } else {
    console.log(`
Usage: mesh-arkade [options]

Commands:
  help         Display this help message
  status       Show Core Hub status
  mount        Mount a library directory
  unmount      Unmount a library directory
  list-mounts  List all mounted libraries (alias: mounts)
  systems      List all supported game systems (fetching from GitHub)
  init        Initialize/seeding system DATs (use: init --seed <system>)
  search      Search wishlist database (use: search <query>)
  reset       Wipe all local database and storage state
  quit        Exit the application
  exit        Exit the application

Options:
  --bare       Run in headless terminal mode
  --headless   Run in headless mode (alias for --bare)
  --json       Output in JSON format
  --silent     Suppress splash screen
  --help       Display help (same as running 'help' command)

For more information, visit: https://github.com/mesharkade/mesh-arkade
`);
  }
}

/**
 * Command handler that delegates to `showHelp` for the `help` command.
 *
 * @intent Expose `showHelp` through the standard `CommandHandler` interface so the dispatcher can invoke it uniformly.
 * @guarantee Calls `showHelp` with the provided options and resolves immediately; ignores the argument string and hub parameters.
 */
export const handleHelp: CommandHandler = async (
  _argsStr: string,
  _hub: unknown,
  options: CommandOptions,
) => {
  showHelp(options);
};
