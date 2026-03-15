/**
 * @file layers/ipfs.ts
 * @description IPFS Gateway fetch layer using Museum Map for SHA1 → CID resolution.
 */

import { getFetch } from "../../core/runtime.js";
import { lookupCid } from "../museum-map.js";
import { FetchLayerError, FetchLayerTimeoutError } from "../errors.js";

/**
 * @intent Configuration options for IPFS fetch layer.
 * @guarantee Gateway URL defaults to ipfs.io; timeout defaults to 30 seconds.
 */
export interface IpfsFetchOptions {
  gatewayUrl?: string;
  timeout?: number;
}

const DEFAULT_GATEWAY_URL = "https://ipfs.io/ipfs";
const DEFAULT_TIMEOUT = 30000;

/**
 * @intent Fetches ROM data from IPFS using the Museum Map to resolve SHA1 to CID.
 * @guarantee Returns a Uint8Array with the ROM data, or throws if not found in map or gateway fails.
 * @param sha1 The SHA1 hash to look up in the Museum Map.
 * @param options Optional gateway URL and timeout configuration.
 */
export async function fetchFromIpfs(
  sha1: string,
  options: IpfsFetchOptions = {},
): Promise<Uint8Array> {
  const gatewayUrl = options.gatewayUrl ?? DEFAULT_GATEWAY_URL;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  const cid = lookupCid(sha1);
  if (!cid) {
    throw new FetchLayerError("ipfs", `SHA1 ${sha1} not found in Museum Map`);
  }

  const url = `${gatewayUrl}/${cid}`;

  try {
    const fetch = await getFetch();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new FetchLayerError(
        "ipfs",
        `Gateway returned ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    if (
      err instanceof FetchLayerError ||
      err instanceof FetchLayerTimeoutError
    ) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchLayerTimeoutError("ipfs", timeout);
    }
    throw new FetchLayerError("ipfs", "Failed to fetch from gateway", err);
  }
}
