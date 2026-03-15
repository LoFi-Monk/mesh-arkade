/**
 * @file fetch-manager.ts
 * @description FetchManager orchestrates sequential P2P layer fallback for ROM fetching.
 */

import { getFs, getPath } from "../core/runtime.js";
import { FetchLayerError, AllLayersFailedError } from "./errors.js";
import { fetchFromHyperswarm } from "./layers/hyperswarm.js";
import { fetchFromIpfs } from "./layers/ipfs.js";
import { fetchFromBittorrent } from "./layers/bittorrent.js";

interface WishlistRecord {
  id?: number;
  system_id: string;
  title: string;
  sha1: string;
  crc: string;
  md5: string;
  region: string;
}

/**
 * @intent Represents progress updates during P2P fetch operations.
 * @guarantee Contains the current layer name, bytes received, and optional total size.
 */
export interface FetchProgress {
  layer: string;
  bytes: number;
  total?: number;
}

/**
 * @intent Configuration options for the FetchManager.
 * @guarantee Each timeout is optional and defaults to 30 seconds.
 */
export interface FetchManagerOptions {
  hyperswarmTimeout?: number;
  ipfsTimeout?: number;
  bittorrentTimeout?: number;
}

type ProgressCallback = (progress: FetchProgress) => void;

/**
 * @intent Orchestrates fetching ROM data from multiple P2P layers with automatic fallback.
 * @guarantee Tries layers sequentially (Hyperswarm → IPFS → DHT) until one succeeds,
 *            or throws AllLayersFailedError with details from all layers.
 */
export class FetchManager {
  private progressCallback: ProgressCallback | null = null;
  private options: FetchManagerOptions;

  constructor(options: FetchManagerOptions = {}) {
    this.options = options;
  }

  /**
   * @intent Registers a callback for progress updates.
   * @guarantee Progress is reset when falling back to a new layer.
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  private reportProgress(layer: string, bytes: number, total?: number): void {
    this.progressCallback?.({ layer, bytes, total });
  }

  /**
   * @intent Fetches ROM data by SHA1, trying each P2P layer in sequence.
   * @guarantee Returns Uint8Array from the first successful layer.
   * @param sha1 The SHA1 hash identifying the ROM.
   */
  async fetch(sha1: string): Promise<Uint8Array> {
    const errors: Array<{ layer: string; error: string }> = [];

    // Layer 1: Hyperswarm
    try {
      this.reportProgress("hyperswarm", 0);
      const data = await fetchFromHyperswarm(sha1, {
        timeout: this.options.hyperswarmTimeout,
        onProgress: (bytes) => this.reportProgress("hyperswarm", bytes),
      });
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ layer: "hyperswarm", error: errorMsg });
    }

    // Layer 2: IPFS
    try {
      this.reportProgress("ipfs", 0);
      const data = await fetchFromIpfs(sha1, {
        timeout: this.options.ipfsTimeout,
      });
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ layer: "ipfs", error: errorMsg });
    }

    // Layer 3: BitTorrent DHT
    try {
      this.reportProgress("bittorrent", 0);
      const data = await fetchFromBittorrent(sha1, {
        timeout: this.options.bittorrentTimeout,
        onProgress: (bytes) => this.reportProgress("bittorrent", bytes),
      });
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ layer: "bittorrent", error: errorMsg });
    }

    throw new AllLayersFailedError(errors);
  }

  /**
   * @intent Fetches ROM by SHA1 and writes it to the destination directory.
   * @guarantee Filename is resolved from wishlist record (using records param) or defaults to <sha1>.bin.
   * @param sha1 The SHA1 hash identifying the ROM.
   * @param destDir The destination directory path.
   * @param records Optional wishlist records to resolve filename from.
   */
  async fetchAndStage(
    sha1: string,
    destDir: string,
    records?: WishlistRecord[],
  ): Promise<string> {
    const data = await this.fetch(sha1);

    let finalFilename: string;
    const normalizedSha1 = sha1.toLowerCase();
    if (records && records.length > 0) {
      const record = records.find(
        (r) => r.sha1 && r.sha1.toLowerCase() === normalizedSha1,
      );
      if (record && record.title) {
        const sanitizedName = record.title.replace(/[<>:"/\\|?*]/g, "_");
        finalFilename = sanitizedName || `${sha1}.bin`;
      } else {
        finalFilename = `${sha1}.bin`;
      }
    } else {
      finalFilename = `${sha1}.bin`;
    }

    const fs = await getFs();
    const path = await getPath();

    const fullPath = path.join(destDir, finalFilename);
    await fs.promises.writeFile(fullPath, Buffer.from(data));

    return finalFilename;
  }
}
