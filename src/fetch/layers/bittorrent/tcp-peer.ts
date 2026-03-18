/**
 * @file tcp-peer.ts
 * @description TCP peer communication for BitTorrent wire protocol.
 */

import { FetchLayerError, FetchLayerTimeoutError } from "../../errors.js";
import { randomNodeId } from "./dht-utils.js";

/**
 * @intent Standard BitTorrent Message IDs.
 */
export enum MessageId {
  CHOKE = 0,
  UNCHOKE = 1,
  INTERESTED = 2,
  NOT_INTERESTED = 3,
  HAVE = 4,
  BITFIELD = 5,
  REQUEST = 6,
  PIECE = 7,
  CANCEL = 8,
  PORT = 9,
}

/**
 * @intent Standard BitTorrent block size (16KB).
 * @guarantee Returns numeric value representing 16KB in bytes (16384).
 */
export const BLOCK_SIZE = 16384;

export async function getNet(): Promise<unknown> {
  if (typeof Bare !== "undefined") {
    return await import("bare-net");
  }
  return await import("net");
}

/**
 * @intent Typed socket interface for BitTorrent wire protocol TCP operations.
 * @guarantee Provides type-safe event handlers for socket events.
 */
export interface TCPSocketLike {
  connect(port: number, host: string, callback?: () => void): unknown;
  write(data: Uint8Array, callback?: (err?: Error) => void): boolean;
  on(event: "data", callback: (data: Uint8Array) => void): unknown;
  on(event: "error", callback: (err: Error) => void): unknown;
  on(event: "close", callback: () => void): unknown;
  on(event: "connect", callback: () => void): unknown;
  destroy(): void;
}

/**
 * @intent Fetches data from a BitTorrent peer via wire protocol.
 * @guarantee Returns Uint8Array with downloaded data (may be partial on timeout/error).
 * @constraint WARNING: Output is NOT SHA1 verified. Callers MUST verify hash before use.
 *             Resolves with partial data on inactivity timeout, socket error, or close.
 *             Uses 5-second inactivity timeout between pieces, distinct from overall operation timeout.
 */
export async function fetchFromPeer(
  peer: { host: string; port: number },
  infoHash: Uint8Array,
  timeout: number,
  onProgress?: (bytes: number) => void,
): Promise<Uint8Array> {
  const net = (await getNet()) as { Socket: new () => unknown };

  return new Promise((resolve, reject) => {
    const socket = new net.Socket() as unknown as TCPSocketLike;

    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
    let handshakeReceived = false;
    let amInterested = false;
    let peerChoking = true;
    let currentPieceIndex = 0;
    let currentOffset = 0;
    const downloadedPieces: Map<
      number,
      Array<{ offset: number; data: Uint8Array }>
    > = new Map();
    let buffer = new Uint8Array(0);
    let isConnected = false;
    let isClosed = false;

    const cleanup = () => {
      clearTimeout(deadlineTimer);
      clearTimeout(inactivityTimer);
      if (!isClosed) {
        isClosed = true;
        socket.destroy();
      }
    };

    const queueRequest = () => {
      if (amInterested && !peerChoking && socket) {
        const requestMsg = createRequestMessage(
          currentPieceIndex,
          currentOffset,
          BLOCK_SIZE,
        );
        socket.write(requestMsg);
      }
    };

    deadlineTimer = setTimeout(() => {
      cleanup();
      reject(new FetchLayerTimeoutError("bittorrent", timeout));
    }, timeout);

    socket.connect(peer.port, peer.host, () => {
      isConnected = true;

      const pstrlen = 19;
      const pstr = "BitTorrent protocol";
      const reserved = new Uint8Array(8);
      reserved[5] = 0x10;
      const peerId = randomNodeId();

      const handshake = new Uint8Array(1 + pstrlen + 8 + 20 + 20);
      handshake[0] = pstrlen;
      for (let i = 0; i < pstrlen; i++) {
        handshake[1 + i] = pstr.charCodeAt(i);
      }
      handshake.set(reserved, 1 + pstrlen);
      handshake.set(infoHash, 1 + pstrlen + 8);
      handshake.set(peerId, 1 + pstrlen + 8 + 20);

      socket.write(handshake);
    });

    const createInterestedMessage = (): Uint8Array => {
      const msg = new Uint8Array(5);
      const view = new DataView(msg.buffer);
      view.setUint32(0, 1, false);
      msg[4] = MessageId.INTERESTED;
      return msg;
    };

    const createRequestMessage = (
      index: number,
      begin: number,
      length: number,
    ): Uint8Array => {
      const msg = new Uint8Array(17);
      const view = new DataView(msg.buffer);
      view.setUint32(0, 13, false);
      msg[4] = MessageId.REQUEST;
      view.setUint32(5, index, false);
      view.setUint32(9, begin, false);
      view.setUint32(13, length, false);
      return msg;
    };

    const parseMessage = (
      data: Uint8Array,
    ): { length: number; id?: number; payload?: Uint8Array } | null => {
      if (data.length < 4) return null;
      const view = new DataView(data.buffer, data.byteOffset, data.length);
      const length = view.getUint32(0, false);
      if (length === 0) return { length: 0 };
      if (data.length < 4 + length) return null;
      const id = data[4];
      const payload = length > 1 ? data.slice(5, 5 + length - 1) : undefined;
      return { length, id, payload };
    };

    const handleMessage = (id: number, payload?: Uint8Array) => {
      switch (id) {
        case MessageId.CHOKE:
          peerChoking = true;
          break;
        case MessageId.UNCHOKE:
          peerChoking = false;
          if (!amInterested) {
            amInterested = true;
            socket.write(createInterestedMessage());
          }
          queueRequest();
          break;
        case MessageId.INTERESTED:
          break;
        case MessageId.NOT_INTERESTED:
          break;
        case MessageId.HAVE:
          if (payload && payload.length === 4) {
            const view = new DataView(payload.buffer, payload.byteOffset, 4);
            const pieceIndex = view.getUint32(0, false);
            if (
              amInterested &&
              !peerChoking &&
              pieceIndex >= currentPieceIndex
            ) {
              currentPieceIndex = pieceIndex;
              currentOffset = 0;
              queueRequest();
            }
          }
          break;
        case MessageId.BITFIELD:
          if (!amInterested) {
            amInterested = true;
            socket.write(createInterestedMessage());
          }
          break;
        case MessageId.PIECE:
          if (payload && payload.length >= 8) {
            const view = new DataView(payload.buffer, payload.byteOffset, 8);
            const index = view.getUint32(0, false);
            const begin = view.getUint32(4, false);
            const block = payload.slice(8);
            const existing = downloadedPieces.get(index);
            if (existing) {
              existing.push({ offset: begin, data: block });
            } else {
              downloadedPieces.set(index, [{ offset: begin, data: block }]);
            }
            currentOffset += block.length;
            clearTimeout(inactivityTimer);
            // Note: 5-second inactivity timeout between pieces is intentional and distinct
            // from the overall operation timeout. This allows slow peers to complete transfers
            // while still detecting when the peer has stopped sending data.
            inactivityTimer = setTimeout(() => {
              cleanup();
              const total = assemblePieces(downloadedPieces);
              onProgress?.(total.length);
              resolve(total);
            }, 5000);
            if (!peerChoking) {
              queueRequest();
            }
          }
          break;
      }
    };

    socket.on("data", (data: Uint8Array) => {
      const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
      const newBuffer = new Uint8Array(buffer.length + arr.length);
      newBuffer.set(buffer);
      newBuffer.set(arr, buffer.length);
      buffer = newBuffer;

      while (buffer.length > 0) {
        if (!handshakeReceived) {
          if (buffer.length < 68) break;
          const handshake = buffer.slice(0, 68);
          if (
            handshake[0] === 19 &&
            String.fromCharCode(...handshake.slice(1, 20)) ===
              "BitTorrent protocol"
          ) {
            handshakeReceived = true;
            buffer = buffer.slice(68);
          } else {
            cleanup();
            reject(
              new FetchLayerError("bittorrent", "Invalid handshake from peer"),
            );
            return;
          }
        } else {
          const parsed = parseMessage(buffer);
          if (parsed === null) break;
          if (parsed.length === 0) {
            buffer = buffer.slice(4);
          } else if (parsed.id !== undefined) {
            handleMessage(parsed.id, parsed.payload);
            buffer = buffer.slice(4 + parsed.length);
          }
        }
      }
    });

    socket.on("error", (err: Error) => {
      cleanup();
      if (downloadedPieces.size > 0) {
        const total = assemblePieces(downloadedPieces);
        onProgress?.(total.length);
        resolve(total);
      } else {
        reject(
          new FetchLayerError(
            "bittorrent",
            `Peer connection error: ${err.message}`,
            err,
          ),
        );
      }
    });

    socket.on("close", () => {
      if (isClosed) return;
      isClosed = true;
      cleanup();
      if (downloadedPieces.size > 0) {
        const total = assemblePieces(downloadedPieces);
        onProgress?.(total.length);
        resolve(total);
      } else {
        reject(
          new FetchLayerError(
            "bittorrent",
            "Connection closed before data received",
          ),
        );
      }
    });
  });
}

export function assemblePieces(
  pieces: Map<number, Array<{ offset: number; data: Uint8Array }>>,
  pieceLength: number = 262144,
): Uint8Array {
  if (pieces.size === 0) return new Uint8Array(0);
  const indices = Array.from(pieces.keys()).sort((a, b) => a - b);
  let totalLength = 0;
  for (const index of indices) {
    const blocks = pieces.get(index)!;
    for (const block of blocks) {
      const blockEnd = index * pieceLength + block.offset + block.data.length;
      totalLength = Math.max(totalLength, blockEnd);
    }
  }
  const result = new Uint8Array(totalLength);
  for (const index of indices) {
    const blocks = pieces.get(index)!;
    const sortedBlocks = [...blocks].sort((a, b) => a.offset - b.offset);
    let pieceData: Uint8Array;
    if (sortedBlocks.length === 1 && sortedBlocks[0].offset === 0) {
      pieceData = sortedBlocks[0].data;
    } else {
      let pieceLengthCalc = 0;
      for (const block of sortedBlocks) {
        pieceLengthCalc = Math.max(
          pieceLengthCalc,
          block.offset + block.data.length,
        );
      }
      pieceData = new Uint8Array(pieceLengthCalc);
      for (const block of sortedBlocks) {
        pieceData.set(block.data, block.offset);
      }
    }
    const absoluteOffset = index * pieceLength;
    result.set(pieceData, absoluteOffset);
  }
  return result;
}
