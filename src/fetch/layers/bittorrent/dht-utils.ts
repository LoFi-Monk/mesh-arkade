/**
 * @file dht-utils.ts
 * @description Utility functions and types for BitTorrent DHT protocol.
 */

import { bencode } from "./bencode.js";

export const DHTTransactionId = {
  generate(): Uint8Array {
    const arr = new Uint8Array(2);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
    }
    return arr;
  },
};

/**
 * @intent Converts a Uint8Array to a lowercase hex string.
 * @guarantee Returns string with each byte as two hex characters.
 */
export function buf2hex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @intent Converts a transaction ID (string or Uint8Array) to a hex string for request tracking.
 * @guarantee Handles both bdecode output types: strings (bytes < 0x80) and Uint8Array (bytes >= 0x80).
 * @constraint Returns consistent hex regardless of whether bdecode returned string or Uint8Array.
 */
export function transactionIdToHex(t: Uint8Array | string): string {
  if (t instanceof Uint8Array) {
    return buf2hex(t);
  }
  return Array.from(t)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @intent Converts a hex string to a Uint8Array.
 * @guarantee Returns Uint8Array with half the length of input hex string.
 * @constraint Input must be valid hex string with even length.
 */
export function hex2buf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

/**
 * @intent Generates a random 20-byte node ID for DHT protocol.
 * @guarantee Returns Uint8Array of exactly 20 random bytes.
 */
export function randomNodeId(): Uint8Array {
  const arr = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return arr;
}

/**
 * @intent Calculates XOR distance between two byte arrays for DHT Kademlia routing.
 * @guarantee Returns Uint8Array with XOR of corresponding bytes, zero-padded to max length.
 */
export function xorDistance(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.max(a.length, b.length);
  const result = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const aByte = i < a.length ? a[i] : 0;
    const bByte = i < b.length ? b[i] : 0;
    result[i] = aByte ^ bByte;
  }
  return result;
}

export interface DHTNode {
  id: Uint8Array;
  address: string;
  port: number;
}

export interface DHTMessage {
  t: Uint8Array | string;
  y: string;
  q?: string;
  r?: Record<string, unknown>;
  e?: unknown[];
}

/**
 * @intent Creates a bencoded DHT get_peers query message.
 * @guarantee Returns bencoded Uint8Array with valid DHT query format.
 * @constraint Uses random node ID; does not persist node ID across queries.
 */
export function createGetPeersQuery(
  infoHash: Uint8Array,
  transactionId: Uint8Array,
): Uint8Array {
  return bencode({
    t: transactionId,
    y: "q",
    q: "get_peers",
    a: {
      id: randomNodeId(),
      info_hash: infoHash,
    },
  });
}

/**
 * @intent Parses compact peer info from DHT responses into host:port pairs.
 * @guarantee Returns valid peer array; silently skips entries shorter than 6 bytes.
 * @constraint Handles string, Uint8Array, and array-of-either formats from bdecode.
 */
export function parsePeers(peers: unknown): Array<{ host: string; port: number }> {
  const result: Array<{ host: string; port: number }> = [];

  if (peers instanceof Uint8Array) {
    for (let i = 0; i < peers.length; i += 6) {
      if (i + 6 <= peers.length) {
        const ip = `${peers[i]}.${peers[i + 1]}.${peers[i + 2]}.${peers[i + 3]}`;
        const port = (peers[i + 4] << 8) | peers[i + 5];
        result.push({ host: ip, port });
      }
    }
  } else if (typeof peers === "string") {
    for (let i = 0; i < peers.length; i += 6) {
      if (i + 6 <= peers.length) {
        const s = peers.substring(i, i + 6);
        const ip = `${s.charCodeAt(0)}.${s.charCodeAt(1)}.${s.charCodeAt(2)}.${s.charCodeAt(3)}`;
        const port = (s.charCodeAt(4) << 8) | s.charCodeAt(5);
        result.push({ host: ip, port });
      }
    }
  } else if (Array.isArray(peers)) {
    for (const peer of peers) {
      if (peer instanceof Uint8Array && peer.length >= 6) {
        const ip = `${peer[0]}.${peer[1]}.${peer[2]}.${peer[3]}`;
        const port = (peer[4] << 8) | peer[5];
        result.push({ host: ip, port });
      } else if (typeof peer === "string" && peer.length >= 6) {
        const s = peer.substring(0, 6);
        const ip = `${s.charCodeAt(0)}.${s.charCodeAt(1)}.${s.charCodeAt(2)}.${s.charCodeAt(3)}`;
        const port = (s.charCodeAt(4) << 8) | s.charCodeAt(5);
        result.push({ host: ip, port });
      }
    }
  }

  return result;
}

function parseNodesFromString(nodes: string): DHTNode[] {
  const result: DHTNode[] = [];
  for (let i = 0; i < nodes.length; i += 26) {
    if (i + 26 <= nodes.length) {
      const s = nodes.substring(i, i + 26);
      const nodeId = new Uint8Array(20);
      for (let j = 0; j < 20; j++) {
        nodeId[j] = s.charCodeAt(j);
      }
      const address = `${s.charCodeAt(20)}.${s.charCodeAt(21)}.${s.charCodeAt(22)}.${s.charCodeAt(23)}`;
      const port = (s.charCodeAt(24) << 8) | s.charCodeAt(25);
      result.push({ id: nodeId, address, port });
    }
  }
  return result;
}

function parseNodesFromBytes(nodes: Uint8Array): DHTNode[] {
  const result: DHTNode[] = [];
  for (let i = 0; i < nodes.length; i += 26) {
    if (i + 26 <= nodes.length) {
      const nodeId = nodes.slice(i, i + 20);
      const address = `${nodes[i + 20]}.${nodes[i + 21]}.${nodes[i + 22]}.${nodes[i + 23]}`;
      const port = (nodes[i + 24] << 8) | nodes[i + 25];
      result.push({ id: nodeId, address, port });
    }
  }
  return result;
}

/**
 * @intent Parses DHT compact node info from either string or Uint8Array format.
 * @guarantee Returns valid DHTNode array; silently skips malformed entries shorter than 26 bytes.
 * @constraint Input must be compact node format: 20-byte node ID + 4-byte IP + 2-byte port per entry.
 */
export function parseNodes(nodes: string | Uint8Array): DHTNode[] {
  if (nodes instanceof Uint8Array) {
    return parseNodesFromBytes(nodes);
  }
  return parseNodesFromString(nodes);
}
