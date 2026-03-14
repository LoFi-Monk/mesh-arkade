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
      mount: "Mount a library directory",
      unmount: "Unmount a library directory",
      "list-mounts": "List all mounted libraries (alias: mounts)",
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
  help         Display this help message
  status       Show Core Hub status
  mount        Mount a library directory
  unmount      Unmount a library directory
  list-mounts  List all mounted libraries (alias: mounts)
  quit         Exit the application
  exit         Exit the application

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
async function handleCommand(input, isJson, mode, hub, rl) {
  const trimmedInput = input.trim();
  if (!trimmedInput) return;

  const parts = trimmedInput.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      showHelp(isJson);
      break;
    case "status":
      showStatus(isJson, mode);
      break;
    case "mount":
      await handleMount(arg, isJson, hub);
      break;
    case "unmount":
      await handleUnmount(arg, isJson, hub);
      break;
    case "list-mounts":
    case "mounts":
      await handleListMounts(isJson, hub);
      break;
    case "quit":
    case "exit":
      console.log("Goodbye!");
      rl.close();
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
 * Handles the mount command to add a library path.
 *
 * @intent Register a new library directory as a mount point.
 * @guarantee Outputs mount result or error to stdout.
 */
async function handleMount(path, isJson, hub) {
  if (!path) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Missing path argument" }));
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
      if (isJson) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(`Error: ${result.error.message}`);
      }
    } else {
      if (isJson) {
        console.log(JSON.stringify(result.result));
      } else {
        console.log(`Mounted: ${path}`);
        console.log(`  Files: ${result.result.fileCount}`);
      }
    }
  } catch (err) {
    if (isJson) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.log(`Error: ${err.message}`);
    }
  }
}

/**
 * Handles the unmount command to remove a library path.
 *
 * @intent Remove a library mount point from the registry.
 * @guarantee Outputs unmount result or error to stdout.
 */
async function handleUnmount(path, isJson, hub) {
  if (!path) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Missing path argument" }));
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
      if (isJson) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(`Error: ${result.error.message}`);
      }
    } else {
      if (isJson) {
        console.log(JSON.stringify(result.result));
      } else {
        console.log(`Unmounted: ${path}`);
      }
    }
  } catch (err) {
    if (isJson) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.log(`Error: ${err.message}`);
    }
  }
}

/**
 * Handles the list-mounts command to show all mounted libraries.
 *
 * @intent Display all registered library mount points.
 * @guarantee Outputs list of mounts or error to stdout.
 */
async function handleListMounts(isJson, hub) {
  try {
    const result = await hub.handleRequest({
      method: "curator:list",
    });

    if (result.error) {
      if (isJson) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(`Error: ${result.error.message}`);
      }
    } else {
      const mounts = result.result;
      if (isJson) {
        console.log(JSON.stringify(mounts));
      } else {
        if (mounts.length === 0) {
          console.log("No libraries mounted.");
        } else {
          console.log("Mounted Libraries:");
          console.log(
            "+----------------------------------+----------+--------+",
          );
          console.log(
            "| Path                             | Status   | Files  |",
          );
          console.log(
            "+----------------------------------+----------+--------+",
          );
          for (const m of mounts) {
            const path =
              m.path.length > 34
                ? "..." + m.path.slice(-31)
                : m.path.padEnd(34);
            const status = m.status.padEnd(8);
            const files = String(m.fileCount).padEnd(6);
            console.log(`| ${path} | ${status} | ${files} |`);
          }
          console.log(
            "+----------------------------------+----------+--------+",
          );
        }
      }
    }
  } catch (err) {
    if (isJson) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.log(`Error: ${err.message}`);
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
    process.exit(0);
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

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  Pear.teardown(async () => {
    rl.close();
    const { hub } = await import("./src/core/hub.js");
    await hub.stop();
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

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
    rl.close();
    return;
  } else {
    console.log("  Mesh ARKade Core Hub initialized");
    console.log(`  Socket: ${hubStatus.socketPath}`);
    console.log(`  Storage: ${hubStatus.storagePath}`);
    console.log("  Type 'help' for available commands");
    console.log("");
  }

  // Check for first run - no mounts configured
  const { loadMounts } = await import("./src/core/storage.js");
  const mounts = await loadMounts();

  if (mounts.length === 0 && !isJson) {
    await runFirstRunWizard(hub, askQuestion);
  }

  // Start interactive CLI loop
  if (!isJson) {
    const mode = isHeadless ? "bare" : "development";
    rl.on("line", async (input) => {
      rl.pause();
      try {
        await handleCommand(input, isJson, mode, hub, rl);
      } finally {
        rl.resume();
      }
    });
  } else {
    rl.close();
  }
}

async function runFirstRunWizard(hub, askQuestion) {
  console.log("");
  console.log(
    "  [MUSEUM BOOT] No libraries detected. Initialization required.",
  );
  console.log("");

  const libraryPath = await askQuestion(
    "  Where is your library? (Enter path): ",
  );

  if (!libraryPath || libraryPath.trim() === "") {
    console.log(
      "  No path entered. You can add a library later with 'mount <path>'.",
    );
    console.log("");
    return;
  }

  const trimmedPath = libraryPath.trim();

  console.log("");
  console.log(`  Mounting: ${trimmedPath}...`);

  try {
    const result = await hub.handleRequest({
      method: "curator:mount",
      params: { path: trimmedPath },
    });

    if (result.error) {
      console.log(`  Error: ${result.error.message}`);
    } else {
      console.log(`  Success! Mounted ${result.result.fileCount} files.`);
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  console.log("");
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
