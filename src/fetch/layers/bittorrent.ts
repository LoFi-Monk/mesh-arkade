/**
 * @file layers/bittorrent.ts
 * @description BitTorrent DHT-based P2P fetch layer using SHA1 as info hash.
 * @note BitTorrent wire protocol implementation requires task 7.1 spike.
 */

import DHT from "bittorrent-dht";
import { FetchLayerError, FetchLayerTimeoutError } from "../errors.js";

/**
 * @intent Configuration options for BitTorrent DHT fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface BittorrentFetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

const DEFAULT_TIMEOUT = 30000;

interface PeerInfo {
  host: string;
  port: number;
}

/**
 * @intent Fetches ROM data from BitTorrent peers discovered via DHT using SHA1 as info hash.
 * @guarantee Returns a Uint8Array with the ROM data, or throws on timeout/failure.
 * @param sha1 The SHA1 hash to use as the BitTorrent info hash.
 * @param options Optional timeout (default 30s) and progress callback.
 */
export async function fetchFromBittorrent(
  sha1: string,
  options: BittorrentFetchOptions = {},
): Promise<Uint8Array> {
  throw new FetchLayerError(
    "bittorrent",
    "BitTorrent wire protocol not yet implemented — layer disabled until milestone 06",
  );

  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const normalizedSha1 = sha1.toLowerCase();

  const dht = new DHT();

  return new Promise<Uint8Array>(async (resolve, reject) => {
    let resolved = false;
    let peers: PeerInfo[] = [];
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        dht.destroy();
        reject(new FetchLayerTimeoutError("bittorrent", timeout));
      }
    }, timeout);

    try {
      dht.on("peer", (peer: PeerInfo) => {
        if (!resolved) {
          peers.push(peer);
          if (peers.length === 1) {
            clearTimeout(timeoutId);
            fetchFromPeer(dht, normalizedSha1, peers[0], options)
              .then((data) => {
                resolved = true;
                dht.destroy();
                resolve(data);
              })
              .catch((err) => {
                dht.destroy();
                reject(err);
              });
          }
        }
      });

      dht.lookup(normalizedSha1);
    } catch (err) {
      clearTimeout(timeoutId);
      dht.destroy();
      reject(new FetchLayerError("bittorrent", "DHT lookup failed", err));
    }
  });
}

// TODO: Spike required - task 7.1
// BitTorrent wire protocol not yet implemented.
// This would require implementing the BEP03 (BitTorrent Protocol) handshake,
// piece request handling, and data assembly.
async function fetchFromPeer(
  _dht: DHT,
  _infoHash: string,
  _peer: PeerInfo,
  _options: BittorrentFetchOptions,
): Promise<Uint8Array> {
  throw new FetchLayerError(
    "bittorrent",
    "BitTorrent wire protocol not yet implemented — spike required (task 7.1)",
  );
}
