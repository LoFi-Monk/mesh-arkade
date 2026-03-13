/**
 * @file index.js
 * @description Dual-mode entry point - boots either GUI (Electron) or Bare (Terminal) based on environment.
 */

// GUI-specific modules are imported dynamically in bootGui() to remain headless-ready.
import readline from "readline";

const isDev = Pear.app.dev;

/**
 * Displays help text to stdout.
 *
 * @intent Provide standard unix-style help output for the CLI.
 * @guarantee Always outputs to stdout and returns void.
 */
function showHelp(isJson) {
  const helpText = {
    commands: {
      help: "Display this help message",
      status: "Show Core Hub status",
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

  if (isJson) {
    console.log(JSON.stringify(helpText));
  } else {
    console.log(`
Usage: mesh-arkade [options]

Commands:
  help     Display this help message
  status   Show Core Hub status
  quit     Exit the application
  exit     Exit the application

Options:
  --bare       Run in headless terminal mode
  --headless   Run in headless mode (alias for --bare)
  --json       Output in JSON format
  --silent     Suppress splash screen
  --help       Display this help message

For more information, visit: https://github.com/mesharkade/mesh-arkade
`);
  }
}

/**
 * Displays status information to stdout.
 *
 * @intent Show current Core Hub status for monitoring/scripting.
 * @guarantee Outputs status object to stdout in appropriate format.
 */
function showStatus(isJson, mode) {
  const status = {
    status: "ready",
    mode,
    version: "0.1.0",
    uptime: process.uptime?.() ?? 0,
  };

  if (isJson) {
    console.log(JSON.stringify(status));
  } else {
    console.log(`
  Status:   ready
  Mode:     ${mode}
  Version:  0.1.0
`);
  }
}

/**
 * Processes user input commands.
 *
 * @intent Handle interactive CLI commands in Bare mode.
 * @guarantee Outputs appropriate response to stdout.
 */
async function handleCommand(input, isJson, mode) {
  const cmd = input.trim().toLowerCase();

  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      showHelp(isJson);
      break;
    case "status":
      showStatus(isJson, mode);
      break;
    case "quit":
    case "exit":
      console.log("Goodbye!");
      process.exit(0);
      break;
    default:
      if (isJson) {
        console.log(JSON.stringify({ error: `Unknown command: ${cmd}` }));
      } else {
        console.log(
          `Unknown command: ${cmd}. Type 'help' for available commands.`,
        );
      }
  }
}

/**
 * Detects the runtime mode and configures accordingly.
 *
 * @intent Route to appropriate boot routine based on environment flags.
 * @guarantee Either GUI bridge or headless TerminalHub is initialized.
 */
async function boot() {
  const args = Pear.app.args ?? [];
  const key = Pear.app.key;
  const isLocal = key === null;
  const isHeadless = args.includes("--bare") || args.includes("--headless");
  const isJson = args.includes("--json");
  const isSilent = args.includes("--silent");
  const hasHelp =
    args.includes("help") || args.includes("--help") || args.includes("-h");

  if (hasHelp) {
    showHelp(isJson);
    return;
  }

  if (isLocal || isHeadless) {
    await bootBare({ isJson, isSilent, isHeadless });
  } else {
    await bootGui();
  }
}

/**
 * Boots the Bare (Terminal) mode - headless operation.
 *
 * @intent Provide a lean terminal interface for headless/local development.
 * @guarantee Displays splash (unless --silent) and status to stdout.
 *            Initializes Core Hub with socket bridge.
 */
async function bootBare(options) {
  const { isJson, isSilent, isHeadless } = options;

  // Initialize Core Hub for local bridge
  const { hub } = await import("./src/core/hub.js");
  await hub.start();

  if (!isSilent) {
    const { appName, getTagline } = await import("./src/core/branding.js");
    const tagline = getTagline();

    if (isJson) {
      console.log(
        JSON.stringify({
          name: appName,
          tagline,
          mode: isHeadless ? "bare" : "development",
        }),
      );
    } else {
      console.log(`
  ███╗   ███╗███████╗███████╗██╗  ██╗     █████╗ ██████╗ ██╗  ██╗ █████╗ ██████╗ ███████╗
  ████╗ ████║██╔════╝██╔════╝██║  ██║    ██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔══██╗██╔════╝
  ██╔████╔██║█████╗  ███████╗███████║    ███████║██████╔╝█████╔╝ ███████║██║  ██║█████╗  
  ██║╚██╔╝██║██╔══╝  ╚════██║██╔══██║    ██╔══██║██╔══██╗██╔═██╗ ██╔══██║██║  ██║██╔══╝  
  ██║ ╚═╝ ██║███████╗███████║██║  ██║    ██║  ██║██║  ██║██║  ██╗██║  ██║██████╔╝███████╗
  ╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝
      `);
      console.log(`  ${tagline}`);
      console.log("");
    }
  }

  const hubStatus = hub.getStatus();
  if (isJson) {
    const status = {
      status: "ready",
      mode: isHeadless ? "bare" : "development",
      socketPath: hubStatus.socketPath,
      storagePath: hubStatus.storagePath,
    };
    console.log(JSON.stringify(status));
  } else {
    console.log("  Mesh ARKade Core Hub initialized");
    console.log(`  Socket: ${hubStatus.socketPath}`);
    console.log(`  Storage: ${hubStatus.storagePath}`);
    console.log("  Type 'help' for available commands");
    console.log("");
  }
}

/**
 * Boots the GUI (Electron) mode.
 *
 * @intent Initialize the Electron runtime with the React UI.
 * @guarantee Bridge is configured and runtime is started with appropriate mount.
 */
async function bootGui() {
  const { default: Runtime } = await import("pear-electron");
  const { default: Bridge } = await import("pear-bridge");

  console.log("Pear Runtime initializing...");

  const runtime = new Runtime();
  let bridge;

  if (isDev) {
    const devServerUrl = "http://localhost:5173";
    bridge = new Bridge({ mount: "/" });
  } else {
    bridge = new Bridge({ mount: "/", directory: "./dist" });
  }

  await bridge.ready();

  const pipe = runtime.start({
    bridge: isDev ? { addr: "http://localhost:5173" } : bridge,
  });

  Pear.teardown(async () => {
    if (pipe && typeof pipe.end === "function") pipe.end();
    await bridge.close();
  });
}

boot().catch((err) => {
  console.error("Failed to boot:", err);
  process.exit(1);
});
