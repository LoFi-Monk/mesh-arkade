/**
 * @file layers/hyperswarm.ts
 * @description Hyperswarm-based P2P fetch layer using SHA1 as topic.
 */

import Hyperswarm from "hyperswarm";
import { FetchLayerTimeoutError, FetchLayerError } from "../errors.js";

interface HyperswarmConnection {
  on(event: "data", callback: (data: Buffer) => void): void;
  on(event: "end", callback: () => void): void;
  on(event: "error", callback: (err: Error) => void): void;
  write(data: Buffer): void;
  end(): void;
}

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

    // Join as client only (receive-only per design spec)
    const discovery = swarm.join(topicBuffer, { client: true, server: false });

    // Wait for discovery to flush (announce to DHT)
    await discovery.flushed();

    // Use Promise.race for timeout
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const connectionPromise = new Promise<HyperswarmConnection>(
      (resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new FetchLayerTimeoutError("hyperswarm", timeout));
        }, timeout);

        swarm.on("connection", (conn, _info) => {
          if (timeoutId) clearTimeout(timeoutId);
          resolve(conn);
        });
      },
    );

    const peer = await connectionPromise;

    const chunks: Buffer[] = [];
    let bytesReceived = 0;

    await new Promise<void>((resolve, reject) => {
      const dataTimeoutId = setTimeout(() => {
        swarm.destroy();
        reject(new FetchLayerTimeoutError("hyperswarm", timeout));
      }, timeout);

      peer.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
        bytesReceived += chunk.length;
        options.onProgress?.(bytesReceived);
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
