/**
 * @file index.js
 * @description Dual-mode entry point - boots either GUI (Electron) or Bare (Terminal) based on environment.
 */

// GUI-specific modules are imported dynamically in bootGui() to remain headless-ready.
// Use bare-readline and bare-tty in Bare runtime, fallback to node:readline for tests/Node environment
let readline;
let stdin;
let stdout;

if (typeof Bare !== "undefined") {
  readline = await import("bare-readline");
  const { ReadStream, WriteStream } = await import("bare-tty");
  stdin = new ReadStream(0);
  stdout = new WriteStream(1);
} else {
  readline = await import("readline");
  stdin = process.stdin;
  stdout = process.stdout;
}

// Global Core Hub instance
var hubInstance;

const isDev = typeof Pear !== "undefined" && Pear.app ? Pear.app.dev : true;

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
    uptime:
      typeof process !== "undefined" && process.uptime ? process.uptime() : 0,
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
async function handleCommand(input, isJson, mode, rl) {
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
      await handleMount(arg, isJson);
      break;
    case "unmount":
      await handleUnmount(arg, isJson);
      break;
    case "list-mounts":
    case "mounts":
      await handleListMounts(isJson);
      break;
    case "init":
      await handleInit(arg, isJson);
      break;
    case "systems":
      await handleSystems(isJson);
      break;
    case "search":
      await handleSearch(arg, isJson);
      break;
    case "reset":
      await handleReset(isJson, rl);
      break;
    case "quit":
    case "exit":
      console.log("Goodbye!");
      rl.close();
      if (typeof Pear !== "undefined") {
        Pear.exit(0);
      } else {
        process.exit(0);
      }
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
async function handleMount(path, isJson) {
  if (!path) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Missing path argument" }));
    } else {
      console.log("Usage: mount <path>");
    }
    return;
  }

  try {
    const result = await hubInstance.handleRequest({
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
async function handleUnmount(path, isJson) {
  if (!path) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Missing path argument" }));
    } else {
      console.log("Usage: unmount <path>");
    }
    return;
  }

  try {
    const result = await hubInstance.handleRequest({
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
async function handleListMounts(isJson) {
  try {
    const result = await hubInstance.handleRequest({
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

function parseArgs(argsStr) {
  const args = {};
  const trimmed = (argsStr || "").trim();
  if (!trimmed) return { args: {}, positional: [] };

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

function drawProgressBar(current, total, width = 40) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  const bar = "=".repeat(filled) + "-".repeat(empty);
  return `[${bar}] ${percentage}% (${current}/${total})`;
}

async function handleInit(argsStr, isJson) {
  const { args, positional } = parseArgs(argsStr);
  const seedFlag = args.seed;
  const system = typeof seedFlag === "string" ? seedFlag : positional[0];

  if (!system) {
    if (isJson) {
      console.log(JSON.stringify({ error: "Usage: init --seed=<system-id>" }));
    } else {
      console.log("Usage: init --seed=<system-id>");
      console.log("Example: init --seed=nes");
    }
    return;
  }

  try {
    if (isJson) {
      const result = await hubInstance.handleRequest({
        method: "curation:seed",
        params: { system },
      });

      if (result.error) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(JSON.stringify(result.result));
      }
    } else {
      console.log(`Seeding system: ${system}`);
      console.log("");

      const result = await hubInstance.handleRequest({
        method: "curation:seed",
        params: { system },
      });

      if (result.error) {
        console.log(`Error: ${result.error.message}`);
      } else {
        const { systemTitle, gamesAdded, totalGames } = result.result;
        console.log("");
        console.log(`Successfully seeded ${systemTitle}`);
        console.log(`  Games added: ${gamesAdded}`);
        console.log(`  Total in database: ${totalGames}`);
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

async function handleSearch(argsStr, isJson) {
  const { args, positional } = parseArgs(argsStr || "");
  const query = positional.join(" ");
  const system = args.system;

  if (!query && !system) {
    if (isJson) {
      console.log(
        JSON.stringify({ error: "Usage: search <query> [--system=<id>]" }),
      );
    } else {
      console.log("Usage: search <query> [--system=<id>]");
      console.log('Example: search "Super Mario"');
      console.log("Example: search --system=nes (lists all NES games)");
    }
    return;
  }

  try {
    const result = await hubInstance.handleRequest({
      method: "curation:search",
      params: { query, system, limit: 20 },
    });

    if (result.error) {
      if (isJson) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(`Error: ${result.error.message}`);
      }
    } else {
      const results = result.result;
      if (isJson) {
        console.log(JSON.stringify(results));
      } else {
        if (results.length === 0) {
          console.log(`No results found for "${query}"`);
        } else {
          console.log(`Found ${results.length} result(s) for "${query}":`);
          console.log("");
          for (const r of results) {
            const sha1 = r.sha1 ? r.sha1.slice(0, 8) + "..." : "N/A";
            console.log(`  ${r.title}`);
            console.log(`    SHA1: ${sha1} | Region: ${r.region}`);
          }
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

async function handleSystems(isJson) {
  try {
    const result = await hubInstance.handleRequest({
      method: "curation:systems",
    });

    if (result.error) {
      if (isJson) {
        console.log(JSON.stringify({ error: result.error.message }));
      } else {
        console.log(`Error: ${result.error.message}`);
      }
    } else {
      const systems = result.result;
      if (isJson) {
        console.log(JSON.stringify(systems));
      } else {
        console.log("Supported Game Systems (fetched from Libretro GitHub):");
        console.log("");
        systems
          .sort((a, b) => a.title.localeCompare(b.title))
          .forEach((s) => console.log(`  - ${s.title} (${s.id})`));
        console.log("");
        console.log("To seed a system, use: init --seed <id>");
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

async function handleReset(isJson, rl) {
  if (isJson) {
    const result = await hubInstance.handleRequest({
      method: "database:reset",
    });
    console.log(JSON.stringify(result.result || result.error));
    return;
  }

  const confirm = await new Promise((resolve) => {
    rl.question(
      "  WARNING: This will wipe all local metadata and databases. Proceed? (y/N): ",
      resolve,
    );
  });

  if (confirm.toLowerCase() === "y") {
    console.log("  Resetting system state...");
    try {
      const result = await hubInstance.handleRequest({
        method: "database:reset",
      });
      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      } else {
        console.log("  Success! System has been reset to a clean state.");
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  } else {
    console.log("  Reset cancelled.");
  }
}

/**
 * Detects the runtime mode and configures accordingly.
 *
 * @intent Route to appropriate boot routine based on environment flags.
 * @guarantee Either GUI bridge or headless TerminalHub is initialized.
 */
async function boot() {
  let args;
  if (typeof Pear !== "undefined") {
    args = Pear.app.args ?? [];
  } else if (typeof Bare !== "undefined") {
    args = Bare.argv.slice(1);
  } else {
    args = process.argv.slice(2);
  }

  const key = typeof Pear !== "undefined" ? Pear.app.key : null;
  const isLocal = key === null;
  const isHeadless = args.includes("--bare") || args.includes("--headless");
  const isJson = args.includes("--json");
  const isSilent = args.includes("--silent");
  const hasHelp =
    args.includes("help") || args.includes("--help") || args.includes("-h");

  if (hasHelp) {
    showHelp(isJson);
    if (typeof Pear !== "undefined") {
      Pear.exit(0);
    } else if (typeof Bare !== "undefined") {
      Bare.exit(0);
    } else {
      process.exit(0);
    }
    return;
  }

  if (isLocal || isHeadless) {
    await bootBare({ isJson, isSilent, isHeadless, args });
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
  const { isJson, isSilent, isHeadless, args } = options;

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  // Initialize Core Hub for local bridge
  const { getEngineHub } = await import("./dist/src/core/hub.js");
  hubInstance = getEngineHub();
  await hubInstance.start();

  // Register lifecycle hooks after initialization to avoid TDZ
  if (typeof Pear !== "undefined") {
    Pear.teardown(async () => {
      rl.close();
      await hubInstance.stop();
    });
  } else if (typeof Bare !== "undefined") {
    Bare.on("exit", () => {
      rl.close();
      hubInstance.stop();
    });
  } else {
    process.on("SIGINT", async () => {
      rl.close();
      await hubInstance.stop();
      process.exit(0);
    });
  }

  if (!isSilent) {
    const { appName, getTagline } = await import("./dist/src/core/branding.js");
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

  const hubStatus = hubInstance.getStatus();
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

  // Check for direct command execution from arguments
  const appFlags = ["--silent", "--json", "--bare", "--headless", "--help"];
  const commandArgs = args.filter((a) => !appFlags.includes(a));
  if (commandArgs.length > 0 && commandArgs[0] !== "help") {
    const mode = isHeadless ? "bare" : "development";
    const input = commandArgs.join(" ");
    await handleCommand(input, isJson, mode, rl);
    rl.close();
    return;
  }

  // Check for first run - no mounts configured
  const { loadMounts } = await import("./dist/src/core/storage.js");
  const mounts = await loadMounts();

  if (mounts.length === 0 && !isJson) {
    await runFirstRunWizard(rl);
  }

  // Start interactive CLI loop
  if (!isJson) {
    const mode = isHeadless ? "bare" : "development";
    rl.on("line", async (input) => {
      rl.pause();
      try {
        await handleCommand(input, isJson, mode, rl);
      } finally {
        rl.resume();
      }
    });
  } else {
    rl.close();
  }
}

async function runFirstRunWizard(rl) {
  console.log("");
  console.log(
    "  [MUSEUM BOOT] No libraries detected. Initialization required.",
  );
  console.log("");

  const libraryPath = await new Promise((resolve) => {
    rl.question("  Where is your library? (Enter path): ", resolve);
  });

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
    const result = await hubInstance.handleRequest({
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
  if (typeof Pear !== "undefined") {
    Pear.exit(1);
  } else if (typeof Bare !== "undefined") {
    Bare.exit(1);
  } else {
    process.exit(1);
  }
});
