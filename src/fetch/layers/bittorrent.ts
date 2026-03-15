/**
 * @file layers/bittorrent.ts
 * @description BitTorrent DHT-based P2P fetch layer using SHA1 as info hash.
 * @note BitTorrent wire protocol implementation requires task 7.1 spike.
 */

import { FetchLayerError } from "../errors.js";

/**
 * @intent Configuration options for BitTorrent DHT fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface BittorrentFetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

/**
 * @intent Fetches ROM data from BitTorrent peers discovered via DHT using SHA1 as info hash.
 * @guarantee Returns a Uint8Array with the ROM data, or throws on timeout/failure.
 * @param sha1 The SHA1 hash to use as the BitTorrent info hash.
 * @param options Optional timeout (default 30s) and progress callback.
 */
export async function fetchFromBittorrent(
  _sha1: string,
  _options: BittorrentFetchOptions = {},
): Promise<Uint8Array> {
  throw new FetchLayerError(
    "bittorrent",
    "BitTorrent wire protocol not yet implemented — layer disabled until milestone 06",
  );
}
