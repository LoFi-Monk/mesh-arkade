/**
 * @file index.ts
 * @description BitTorrent DHT-based P2P fetch layer using SHA1 as info hash.
 * @constraint Uses bare-dgram for UDP and bare-net for TCP, compatible with Bare runtime.
 */

import { FetchLayerError } from "../../errors.js";
import { getCrypto } from "../../../core/runtime.js";
import { hex2buf } from "./dht-utils.js";
import { DHTClient, DEFAULT_TIMEOUT, BOOTSTRAP_NODES } from "./dht-client.js";
import { fetchFromPeer } from "./tcp-peer.js";

/**
 * @intent Configuration options for BitTorrent DHT fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface BittorrentFetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

/**
 * @intent Verifies that fetched data matches the expected SHA1 hash.
 * @guarantee Returns true only if the SHA1 of data matches expectedHex (case-insensitive).
 * @constraint Uses getCrypto() for Bare-compatible hashing.
 */
export async function verifySha1(
  data: Uint8Array,
  expectedHex: string,
): Promise<boolean> {
  const crypto = await getCrypto();
  const hash = crypto.createHash("sha1");
  hash.update(data);
  const actual = hash.digest("hex").toLowerCase();
  return actual === expectedHex.toLowerCase();
}

/**
 * @intent Fetches ROM data from BitTorrent peers discovered via DHT using SHA1 as info hash.
 * @guarantee Returns a Uint8Array with the ROM data, or throws on timeout/failure.
 * @param sha1 The SHA1 hash to use as the BitTorrent info hash.
 * @param options Optional timeout (default 30s) and progress callback.
 * @constraint Validates SHA1 is 40 hex characters before attempting fetch.
 */
export async function fetchFromBittorrent(
  sha1: string,
  options: BittorrentFetchOptions = {},
): Promise<Uint8Array> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  if (!sha1 || sha1.length !== 40 || !/^[0-9a-fA-F]{40}$/.test(sha1)) {
    throw new FetchLayerError(
      "bittorrent",
      `Invalid SHA1: must be 40 hex characters, got '${sha1}'`,
    );
  }

  const infoHash = hex2buf(sha1.toLowerCase());

  const dht = new DHTClient(infoHash, timeout, BOOTSTRAP_NODES);

  try {
    await dht.initialize();

    const peers = await dht.lookup();

    if (peers.length === 0) {
      throw new FetchLayerError("bittorrent", "No peers found via DHT");
    }

    let lastError: Error | null = null;

    for (const peer of peers) {
      try {
        const data = await fetchFromPeer(
          peer,
          infoHash,
          timeout,
          options.onProgress,
        );

        const hashValid = await verifySha1(data, sha1);
        if (!hashValid) {
          lastError = new FetchLayerError(
            "bittorrent",
            `SHA1 mismatch: peer ${peer.host}:${peer.port} returned data that does not match expected hash`,
          );
          continue;
        }

        return data;
      } catch (err) {
        lastError = err as Error;
        continue;
      }
    }

    throw new FetchLayerError(
      "bittorrent",
      `All ${peers.length} peers failed: ${lastError?.message ?? "Unknown error"}`,
    );
  } finally {
    dht.close();
  }
}

export { DEFAULT_TIMEOUT, BOOTSTRAP_NODES };
export { bencode, bdecode } from "./bencode.js";
export {
  DHTTransactionId,
  buf2hex,
  transactionIdToHex,
  hex2buf,
  randomNodeId,
  xorDistance,
  DHTNode,
  DHTMessage,
  createGetPeersQuery,
  parsePeers,
  parseNodes,
} from "./dht-utils.js";
export { getDgram, UDPTransceiver, UDPSocketLike } from "./udp-transceiver.js";
export { DHTClient } from "./dht-client.js";
export {
  MessageId,
  BLOCK_SIZE,
  getNet,
  TCPSocketLike,
  fetchFromPeer,
  assemblePieces,
} from "./tcp-peer.js";
