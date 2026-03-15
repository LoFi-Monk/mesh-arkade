/**
 * @file layers/hyperswarm.ts
 * @description Hyperswarm-based P2P fetch layer using SHA1 as topic.
 */

import Hyperswarm from "hyperswarm";
import { FetchLayerTimeoutError, FetchLayerError } from "../errors.js";

/**
 * @intent Configuration options for Hyperswarm fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface FetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

const DEFAULT_TIMEOUT = 30000;

/**
 * @intent Fetches ROM data from Hyperswarm peers using SHA1 as the topic key.
 * @guarantee Returns a Uint8Array with the ROM data, or throws on timeout/failure.
 * @param sha1 The SHA1 hash to use as the topic for peer discovery.
 * @param options Optional timeout (default 30s) and progress callback.
 */
export async function fetchFromHyperswarm(
  sha1: string,
  options: FetchOptions = {},
): Promise<Uint8Array> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const normalizedSha1 = sha1.toLowerCase();

  const swarm = new Hyperswarm();

  try {
    // Zero-pad SHA1 (20 bytes) to 32-byte topic buffer for Hyperswarm
    const sha1Buf = Buffer.from(normalizedSha1, "hex");
    const topicBuffer = Buffer.alloc(32);
    sha1Buf.copy(topicBuffer);

    const discovery = swarm.join(topicBuffer, { client: true, server: true });

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    await new Promise<void>((resolve, reject) => {
      discovery.on("peer", () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      });
      timeoutId = setTimeout(() => {
        reject(new FetchLayerTimeoutError("hyperswarm", timeout));
      }, timeout);

      discovery.on("ready", () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!discovery.connected) {
          reject(new FetchLayerTimeoutError("hyperswarm", timeout));
        }
      });
    });

    const peer = swarm.getConnections()[0];
    if (!peer) {
      throw new FetchLayerError(
        "hyperswarm",
        "No peers available after discovery",
      );
    }

    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const dataTimeoutId = setTimeout(() => {
        swarm.destroy();
        reject(new FetchLayerTimeoutError("hyperswarm", timeout));
      }, timeout);

      peer.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
        options.onProgress?.(chunks.reduce((acc, c) => acc + c.length, 0));
      });

      peer.on("end", () => {
        clearTimeout(dataTimeoutId);
        resolve();
      });

      peer.on("error", (err: Error) => {
        clearTimeout(dataTimeoutId);
        reject(new FetchLayerError("hyperswarm", "Peer stream error", err));
      });
    });

    const result = Buffer.concat(chunks);
    swarm.destroy();
    return new Uint8Array(result);
  } catch (err) {
    try {
      swarm.destroy();
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}
