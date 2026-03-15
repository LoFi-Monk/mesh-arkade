import type {
  CommandHandler,
  CommandOptions,
  CoreHub,
  SystemInfo,
} from "../types.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that fetches and displays all supported game systems from the curation layer.
 *
 * @intent Let users discover which system IDs are available for seeding via `init --seed`.
 * @guarantee Resolves after printing an alphabetically sorted system list or an error message; never throws.
 */
export const handleSystems: CommandHandler = async (
  _argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  try {
    const result = await hub.handleRequest({
      method: "curation:systems",
    });

    if (result.error) {
      error(result.error.message, options);
    } else {
      const systems = result.result as SystemInfo[];
      if (options.isJson) {
        output(systems, options);
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
    error((err as Error).message, options);
  }
};
