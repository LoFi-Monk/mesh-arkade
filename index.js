/**
 * @file index.js
 * @description Dual-mode entry point - boots either GUI (Electron) or Bare (Terminal) based on environment.
 */

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

let hubInstance;

const commands = {
  mount: () => import("./dist/src/cli/commands/mount.js"),
  unmount: () => import("./dist/src/cli/commands/unmount.js"),
  "list-mounts": () => import("./dist/src/cli/commands/list.js"),
  mounts: () => import("./dist/src/cli/commands/list.js"),
  systems: () => import("./dist/src/cli/commands/systems.js"),
  init: () => import("./dist/src/cli/commands/init.js"),
  search: () => import("./dist/src/cli/commands/search.js"),
  reset: () => import("./dist/src/cli/commands/reset.js"),
  status: () => import("./dist/src/cli/commands/status.js"),
  help: () => import("./dist/src/cli/commands/help.js"),
};

const commandHandlers = {
  mount: "handleMount",
  unmount: "handleUnmount",
  "list-mounts": "handleListMounts",
  mounts: "handleListMounts",
  systems: "handleSystems",
  init: "handleInit",
  search: "handleSearch",
  reset: "handleReset",
  status: "handleStatus",
  help: "handleHelp",
};

async function handleCommand(input, isJson, mode, rl) {
  const trimmedInput = input.trim();
  if (!trimmedInput) return;

  const parts = trimmedInput.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (cmd === "quit" || cmd === "exit") {
    console.log("Goodbye!");
    rl.close();
    if (typeof Pear !== "undefined") {
      Pear.exit(0);
    } else if (typeof Bare !== "undefined") {
      Bare.exit(0);
    } else {
      process.exit(0);
    }
    return;
  }

  const commandLoader = commands[cmd];
  if (commandLoader) {
    try {
      const mod = await commandLoader();
      const handlerName = commandHandlers[cmd];
      const handler = mod[handlerName];
      await handler(arg, hubInstance, { isJson, isSilent: false }, rl);
    } catch (err) {
      if (isJson) {
        console.log(JSON.stringify({ error: err.message }));
      } else {
        console.log(`Error: ${err.message}`);
      }
    }
  } else {
    if (isJson) {
      console.log(JSON.stringify({ error: `Unknown command: ${cmd}` }));
    } else {
      console.log(
        `Unknown command: ${cmd}. Type 'help' for available commands.`,
      );
    }
  }
}

async function boot() {
  const { detectEnvironment } = await import("./dist/src/core/environment.js");
  const env = detectEnvironment();

  const args =
    env.isHeadless || env.isLocal
      ? typeof Pear !== "undefined"
        ? (Pear.app.args ?? [])
        : typeof Bare !== "undefined"
          ? Bare.argv.slice(1)
          : process.argv.slice(2)
      : [];

  const { parseAppFlags } = await import("./dist/src/cli/parser.js");
  const {
    isJson,
    isSilent,
    isHeadless,
    hasHelp,
    remaining: commandArgs,
  } = parseAppFlags(args);

  if (hasHelp) {
    const { showHelp } = await import("./dist/src/cli/commands/help.js");
    showHelp({ isJson, isSilent });
    if (typeof Pear !== "undefined") {
      Pear.exit(0);
    } else if (typeof Bare !== "undefined") {
      Bare.exit(0);
    } else {
      process.exit(0);
    }
    return;
  }

  if (env.isLocal || isHeadless) {
    await bootBare({
      isJson,
      isSilent,
      isHeadless,
      args: commandArgs,
      mode: isHeadless ? "bare" : "development",
    });
  } else {
    await bootGui();
  }
}

async function bootBare(options) {
  const { isJson, isSilent, args, mode } = options;

  const rl = readline.createInterface({ input: stdin, output: stdout });

  const { getEngineHub } = await import("./dist/src/core/hub.js");
  hubInstance = getEngineHub();
  await hubInstance.start();

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
      console.log(JSON.stringify({ name: appName, tagline, mode }));
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
  if (!isSilent) {
    if (isJson) {
      console.log(
        JSON.stringify({
          status: "ready",
          mode,
          socketPath: hubStatus.socketPath,
          storagePath: hubStatus.storagePath,
        }),
      );
    } else {
      console.log("  Mesh ARKade Core Hub initialized");
      console.log(`  Socket: ${hubStatus.socketPath}`);
      console.log(`  Storage: ${hubStatus.storagePath}`);
      console.log("  Type 'help' for available commands");
      console.log("");
    }
  }

  if (args.length > 0 && args[0] !== "help") {
    await handleCommand(args.join(" "), isJson, mode, rl);
    rl.close();
    return;
  }

  const { loadMounts } = await import("./dist/src/core/storage.js");
  const mounts = await loadMounts();

  if (mounts.length === 0 && !isJson) {
    const { runFirstRunWizard } = await import("./dist/src/cli/wizard.js");
    await runFirstRunWizard(rl, hubInstance);
  }

  if (!isJson) {
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

async function bootGui() {
  const { default: Runtime } = await import("pear-electron");
  const { default: Bridge } = await import("pear-bridge");

  console.log("Pear Runtime initializing...");

  const runtime = new Runtime();
  let bridge;

  const isDev = typeof Pear !== "undefined" && Pear.app ? Pear.app.dev : true;

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
