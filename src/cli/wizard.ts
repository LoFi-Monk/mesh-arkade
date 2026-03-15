import type { CoreHub, ReadlineInterface } from "./types.js";

/**
 * Guides a first-time user through mounting their initial library via an interactive prompt.
 *
 * @intent Reduce onboarding friction by prompting for a library path when no libraries are detected on startup.
 * @guarantee Prompts the user exactly once, attempts a `curator:mount` request if a path is provided, and prints a clear outcome message; resolves without throwing regardless of mount success or failure.
 */
export async function runFirstRunWizard(
  rl: ReadlineInterface,
  hub: CoreHub,
): Promise<void> {
  console.log("");
  console.log(
    "  [MUSEUM BOOT] No libraries detected. Initialization required.",
  );
  console.log("");

  const libraryPath = await new Promise<string>((resolve) => {
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
    const result = await hub.handleRequest({
      method: "curator:mount",
      params: { path: trimmedPath },
    });

    if (result.error) {
      console.log(`  Error: ${result.error.message}`);
    } else {
      console.log(
        `  Success! Mounted ${(result.result as { fileCount: number }).fileCount} files.`,
      );
    }
  } catch (err) {
    console.log(`  Error: ${(err as Error).message}`);
  }

  console.log("");
}
