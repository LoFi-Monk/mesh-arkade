import type {
  CommandHandler,
  CommandOptions,
  CoreHub,
  MountEntry,
} from "../types.js";
import { table, error } from "../formatter.js";

/**
 * Command handler that retrieves and displays all currently mounted library directories.
 *
 * @intent Let users inspect which libraries the hub is tracking via the `list-mounts` command.
 * @guarantee Renders mount entries as a table or JSON array; resolves after printing results or an error message; never throws.
 */
export const handleListMounts: CommandHandler = async (
  _argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  try {
    const result = await hub.handleRequest({
      method: "curator:list",
    });

    if (result.error) {
      error(result.error.message, options);
    } else {
      const mounts = result.result as MountEntry[];
      table(mounts, options);
    }
  } catch (err) {
    error((err as Error).message, options);
  }
};
