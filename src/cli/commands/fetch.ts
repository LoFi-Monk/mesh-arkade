/**
 * @file commands/fetch.ts
 * @description CLI command handler for fetching ROMs via P2P layers.
 */

import type { CommandHandler, CommandOptions, CoreHub } from "../types.js";
import { parseArgs } from "../parser.js";
import { output, error } from "../formatter.js";
import { FetchManager } from "../../fetch/fetch-manager.js";
import { AllLayersFailedError, FetchLayerError } from "../../fetch/errors.js";
import { getFs, getPath } from "../../core/runtime.js";
import type { WishlistRecord } from "../../core/database.js";

const SHA1_REGEX = /^[0-9a-fA-F]{40}$/;

/**
 * @intent Handle the 'fetch' command to retrieve ROMs by SHA1 hash from P2P sources.
 * @guarantee Validates SHA1 format, checks for mounted library, orchestrates FetchManager, and outputs results.
 */
export const handleFetch: CommandHandler = async (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
) => {
  const { args, positional } = parseArgs(argsStr || "");
  const sha1 = positional[0];

  if (!sha1) {
    if (options.isJson) {
      output({ error: "Usage: fetch <sha1>" }, options);
    } else {
      console.log("Usage: fetch <sha1>");
      console.log("Example: fetch abc123def456789012345678901234567890abcd");
    }
    return;
  }

  const normalizedSha1 = sha1.toLowerCase();
  if (!SHA1_REGEX.test(normalizedSha1)) {
    error(
      `Invalid SHA1: must be exactly 40 hexadecimal characters. Got: ${sha1}`,
      options,
    );
    return;
  }

  try {
    const fs = await getFs();
    const path = await getPath();

    const mountsResult = await hub.handleRequest({
      method: "curator:list",
    });

    if (mountsResult.error) {
      error(mountsResult.error.message, options);
      return;
    }

    const mounts = (mountsResult.result || []) as Array<{
      path: string;
      status: string;
    }>;

    if (mounts.length === 0) {
      error("No library mounted. Run 'mount' first to add a library.", options);
      return;
    }

    const activeMount = mounts.find((m) => m.status === "active");
    if (!activeMount) {
      error(
        "No active library mounted. Run 'mount' first to add a library.",
        options,
      );
      return;
    }

    const stagePath = path.join(activeMount.path, "stage");
    if (!fs.existsSync(stagePath)) {
      fs.mkdirSync(stagePath, { recursive: true });
    }

    const fetchManager = new FetchManager();

    if (!options.isSilent) {
      console.log(`Fetching ROM: ${normalizedSha1}`);
      console.log(`Target: ${stagePath}`);

      fetchManager.onProgress((progress) => {
        // Use console.log with carriage return instead of process.stdout.write for Bare compatibility
        console.log(
          `\r[${progress.layer}] Received ${progress.bytes} bytes... `,
        );
      });
    }

    const lookupResult = await hub.handleRequest({
      method: "curation:lookup-sha1",
      params: { sha1: normalizedSha1 },
    });
    if (lookupResult.error) {
      console.warn(`[fetch] SHA1 name lookup failed: ${lookupResult.error.message} — falling back to <sha1>.bin`);
    }
    const record = lookupResult.result as WishlistRecord | null;
    const records: WishlistRecord[] = record ? [record] : [];
    const filename = await fetchManager.fetchAndStage(
      normalizedSha1,
      stagePath,
      records,
    );

    if (!options.isSilent) {
      console.log("");
      console.log(`Staged: ${filename}`);
    }

    if (options.isJson) {
      output({ success: true, filename, sha1: normalizedSha1 }, options);
    }
  } catch (err) {
    if (err instanceof AllLayersFailedError) {
      if (options.isJson) {
        output(
          {
            error: "All fetch layers failed",
            layers: err.errors,
          },
          options,
        );
      } else {
        console.log("");
        console.log("All fetch layers failed:");
        for (const layerErr of err.errors) {
          console.log(`  - ${layerErr.layer}: ${layerErr.error}`);
        }
      }
    } else if (err instanceof FetchLayerError) {
      error(`Fetch failed (${err.layer}): ${err.message}`, options);
    } else {
      error(`Fetch failed: ${(err as Error).message}`, options);
    }
  }
};
