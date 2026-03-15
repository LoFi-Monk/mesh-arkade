import type {
  CommandHandler,
  CommandOptions,
  CoreHub,
  SearchResult,
} from "../types.js";
import { parseArgs } from "../parser.js";
import { output, error } from "../formatter.js";

/**
 * Command handler that queries the wishlist database and displays matching game entries.
 *
 * @intent Allow users to find games in the seeded DAT database using a title query and optional system filter.
 * @guarantee Resolves after printing up to 20 results or an error message; never throws.
 */
export const handleSearch: CommandHandler = async (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  const { args, positional } = parseArgs(argsStr || "");
  const query = positional.join(" ");
  const system = args.system as string | undefined;

  if (!query && !system) {
    if (options.isJson) {
      output({ error: "Usage: search <query> [--system=<id>]" }, options);
    } else {
      console.log("Usage: search <query> [--system=<id>]");
      console.log('Example: search "Super Mario"');
      console.log("Example: search --system=nes (lists all NES games)");
    }
    return;
  }

  try {
    const result = await hub.handleRequest({
      method: "curation:search",
      params: { query, system, limit: 20 },
    });

    if (result.error) {
      error(result.error.message, options);
    } else {
      const results = result.result as SearchResult[];
      if (options.isJson) {
        output(results, options);
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
    error((err as Error).message, options);
  }
};
