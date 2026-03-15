import type { CommandHandler, CommandOptions, CoreHub } from "../types.js";
import { parseArgs } from "../parser.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that seeds a game system's DAT database via the curation layer.
 *
 * @intent Allow users to populate the wishlist database for a specific system using `init --seed=<system>`.
 * @guarantee Resolves after printing seed results or an error message; never throws.
 */
export const handleInit: CommandHandler = async (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  const { args, positional } = parseArgs(argsStr);
  const seedFlag = args.seed;
  const system = typeof seedFlag === "string" ? seedFlag : positional[0];

  if (!system) {
    if (options.isJson) {
      output({ error: "Usage: init --seed=<system-id>" }, options);
    } else {
      console.log("Usage: init --seed=<system-id>");
      console.log("Example: init --seed=nes");
    }
    return;
  }

  try {
    if (!options.isJson) {
      console.log(`Seeding system: ${system}`);
      console.log("");
    }

    const result = await hub.handleRequest({
      method: "curation:seed",
      params: { system },
    });

    if (result.error) {
      error(result.error.message, options);
    } else if (options.isJson) {
      output(result.result, options);
    } else {
      const { systemTitle, gamesAdded, totalGames } = result.result as {
        systemTitle: string;
        gamesAdded: number;
        totalGames: number;
      };

      console.log(`Successfully seeded ${systemTitle}`);
      console.log(`  Games added: ${gamesAdded}`);
      console.log(`  Total in database: ${totalGames}`);
    }
  } catch (err) {
    error((err as Error).message, options);
  }
};
