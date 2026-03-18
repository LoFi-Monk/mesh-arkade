/**
 * @file layers/bittorrent.ts
 * @description BitTorrent DHT-based P2P fetch layer using SHA1 as info hash.
 * @constraint Uses bare-dgram for UDP and bare-net for TCP, compatible with Bare runtime.
 */

import { FetchLayerError, FetchLayerTimeoutError } from "../errors.js";
import { getCrypto } from "../../core/runtime.js";

/**
 * @intent Configuration options for BitTorrent DHT fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface BittorrentFetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

/**
 * @intent Default timeout for DHT operations in milliseconds.
 * @guarantee Returns numeric value representing 30 seconds in ms.
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * @intent Bootstrap nodes for the BitTorrent DHT network.
 * @guarantee Returns array of DHT router addresses for network initialization.
 */
export const BOOTSTRAP_NODES = [
  "router.bittorrent.com:6881",
  "router.utorrent.com:6881",
  "dht.transmissionbt.com:6881",
];

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
 */
export const BLOCK_SIZE = 16384;

const DHTTransactionId = {
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

function buf2hex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @intent Converts a transaction ID (string or Uint8Array) to a hex string for request tracking.
 * @guarantee Handles both bdecode output types: strings (bytes < 0x80) and Uint8Array (bytes >= 0x80).
 * @constraint Returns consistent hex regardless of whether bdecode returned string or Uint8Array.
 */
function transactionIdToHex(t: Uint8Array | string): string {
  if (t instanceof Uint8Array) {
    return buf2hex(t);
  }
  return Array.from(t)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function hex2buf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
}

function randomNodeId(): Uint8Array {
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
 * @intent Encodes JavaScript data into Bencode format for BitTorrent DHT protocol.
 * @param data - The data to encode (string, number, Uint8Array, array, or object).
 * @returns The Bencode-encoded data as a Uint8Array.
 * @guarantee Returns valid bencoded Uint8Array, throws on floats or unsupported types.
 */
export function bencode(data: unknown): Uint8Array {
  if (typeof data === "number") {
    if (Number.isInteger(data)) {
      return new TextEncoder().encode(`i${data}e`);
    }
    throw new Error("Float not supported in bencode");
  }

  if (typeof data === "string") {
    const encoded = new TextEncoder().encode(data);
    return concatenateUint8Arrays([
      new TextEncoder().encode(`${encoded.length}:`),
      encoded,
    ]);
  }

  if (data instanceof Uint8Array) {
    return concatenateUint8Arrays([
      new TextEncoder().encode(`${data.length}:`),
      data,
    ]);
  }

  if (Array.isArray(data)) {
    const parts: Uint8Array[] = [];
    parts.push(new TextEncoder().encode("l"));
    for (const item of data) {
      parts.push(bencode(item));
    }
    parts.push(new TextEncoder().encode("e"));
    return concatenateUint8Arrays(parts);
  }

  if (typeof data === "object" && data !== null) {
    const parts: Uint8Array[] = [];
    parts.push(new TextEncoder().encode("d"));
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      parts.push(bencode(key));
      parts.push(bencode(obj[key]));
    }
    parts.push(new TextEncoder().encode("e"));
    return concatenateUint8Arrays(parts);
  }

  throw new Error(`Unsupported type: ${typeof data}`);
}

/**
 * @intent Decodes Bencode format data from BitTorrent DHT protocol into JavaScript.
 * @param data - The Bencode-encoded Uint8Array to decode.
 * @returns The decoded JavaScript data (string, number, Uint8Array, array, or object).
 * @guarantee Returns parsed JavaScript data or throws on malformed bencode.
 */
export function bdecode(data: Uint8Array): unknown {
  let position = 0;

  function peek(): number {
    return data[position];
  }

  function consume(): number {
    return data[position++];
  }

  function parse(): unknown {
    if (position >= data.length) {
      throw new Error("Unexpected end of input");
    }

    const char = peek();

    if (char >= 0x30 && char <= 0x39) {
      return parseString();
    }

    if (char === 0x69) {
      return parseInt_();
    }

    if (char === 0x6c) {
      return parseList();
    }

    if (char === 0x64) {
      return parseDict();
    }

    throw new Error(`Unexpected character: ${String.fromCharCode(char)}`);
  }

  function parseString(): Uint8Array | string {
    let numStart = position;
    while (position < data.length && peek() >= 0x30 && peek() <= 0x39) {
      position++;
    }
    if (position >= data.length || peek() !== 0x3a) {
      throw new Error("Invalid string format");
    }
    const length = parseInt(
      String.fromCharCode(...data.slice(numStart, position)),
      10,
    );
    position++;
    const start = position;
    const end = start + length;
    if (end > data.length) {
      throw new Error(
        `String length ${length} exceeds available data (${data.length - start} bytes remaining)`,
      );
    }
    position = end;
    const hasHighBytes = data.slice(start, end).some((b) => b >= 0x80);
    if (hasHighBytes) {
      return data.slice(start, end);
    }
    return String.fromCharCode(...data.slice(start, end));
  }

  function parseInt_(): number {
    consume();
    const start = position;
    while (position < data.length && peek() !== 0x65) {
      position++;
    }
    if (position >= data.length) {
      throw new Error("Invalid integer format");
    }
    const result = parseInt(
      String.fromCharCode(...data.slice(start, position)),
      10,
    );
    position++;
    return result;
  }

  function parseList(): unknown[] {
    consume();
    const result: unknown[] = [];
    while (position < data.length && peek() !== 0x65) {
      result.push(parse());
    }
    if (position >= data.length) {
      throw new Error("Unterminated list");
    }
    position++;
    return result;
  }

  function parseDict(): Record<string, unknown> {
    consume();
    const result: Record<string, unknown> = {};
    while (position < data.length && peek() !== 0x65) {
      const rawKey = parse();
      const key =
        rawKey instanceof Uint8Array
          ? String.fromCharCode(...rawKey)
          : (rawKey as string);
      const value = parse();
      result[key] = value;
    }
    if (position >= data.length) {
      throw new Error("Unterminated dict");
    }
    position++;
    return result;
  }

  const result = parse();
  if (position !== data.length) {
    throw new Error("Extra data after decoding");
  }
  return result;
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function xorDistance(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.max(a.length, b.length);
  const result = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const aByte = i < a.length ? a[i] : 0;
    const bByte = i < b.length ? b[i] : 0;
    result[i] = aByte ^ bByte;
  }
  return result;
}

interface DHTNode {
  id: Uint8Array;
  address: string;
  port: number;
}

interface DHTMessage {
  t: Uint8Array | string;
  y: string;
  q?: string;
  r?: Record<string, unknown>;
  e?: unknown[];
}

function createGetPeersQuery(
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
function parsePeers(peers: unknown): Array<{ host: string; port: number }> {
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

/**
 * @intent Parses DHT compact node info from either string or Uint8Array format.
 * @guarantee Returns valid DHTNode array; silently skips malformed entries shorter than 26 bytes.
 * @constraint Input must be compact node format: 20-byte node ID + 4-byte IP + 2-byte port per entry.
 */
function parseNodes(nodes: string | Uint8Array): DHTNode[] {
  if (nodes instanceof Uint8Array) {
    return parseNodesFromBytes(nodes);
  }
  return parseNodesFromString(nodes);
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
 * @intent Verifies that fetched data matches the expected SHA1 hash.
 * @guarantee Returns true only if the SHA1 of data matches expectedHex (case-insensitive).
 * @constraint Uses getCrypto() for Bare-compatible hashing.
 */
async function verifySha1(
  data: Uint8Array,
  expectedHex: string,
): Promise<boolean> {
  const crypto = await getCrypto();
  const hash = crypto.createHash("sha1");
  hash.update(data);
  const actual = hash.digest("hex").toLowerCase();
  return actual === expectedHex.toLowerCase();
}

async function getDgram(): Promise<unknown> {
  if (typeof Bare !== "undefined") {
    return (await import("bare-dgram")).default;
  }
  return await import("dgram");
}

async function getNet(): Promise<unknown> {
  if (typeof Bare !== "undefined") {
    return await import("bare-net");
  }
  return await import("net");
}

class UDPTransceiver {
  private socket: unknown = null;
  private address: string = "";
  private port: number = 0;
  private pendingRequests: Map<
    string,
    {
      resolve: (data: Uint8Array) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private messageCallbacks: ((
    msg: DHTMessage,
    rinfo: { address: string; port: number },
  ) => void)[] = [];
  private errorCallback: ((err: Error) => void) | null = null;
  private bound = false;

  public setErrorCallback(callback: (err: Error) => void): void {
    this.errorCallback = callback;
  }

  private getSocket(): {
    send(
      buffer: Uint8Array,
      port: number,
      address: string,
      callback?: (err: Error | null) => void,
    ): void;
    close(): void;
  } {
    return this.socket as {
      bind(port: number, callback?: () => void): void;
      send(
        buffer: Uint8Array,
        port: number,
        address: string,
        callback?: (err: Error | null) => void,
      ): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(event: string, callback: any): void;
      address(): { address: string; port: number };
      close(): void;
    };
  }

  async bind(port: number = 0): Promise<{ address: string; port: number }> {
    const dgram = (await getDgram()) as { createSocket(type: "udp4"): unknown };
    const socket = dgram.createSocket("udp4") as {
      bind(port: number, callback?: () => void): void;
      send(
        buffer: Uint8Array,
        port: number,
        address: string,
        callback?: (err: Error | null) => void,
      ): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(event: string, callback: any): void;
      address(): { address: string; port: number };
      close(): void;
    };
    this.socket = socket;

    return new Promise((resolve, reject) => {
      const handleError = (err: Error) => {
        if (!this.bound) {
          reject(err);
        } else {
          this.errorCallback?.(err);
        }
      };

      socket.on("error", handleError);

      socket.bind(port, () => {
        this.bound = true;
        const addr = socket.address();
        this.address = addr.address;
        this.port = addr.port;
        resolve({ address: this.address, port: this.port });
      });

      socket.on(
        "message",
        (
          msg: Buffer | Uint8Array,
          rinfo: { address: string; port: number },
        ) => {
          const data = msg instanceof Uint8Array ? msg : new Uint8Array(msg);
          this.handleMessage(data, rinfo);
        },
      );
    });
  }

  private handleMessage(
    data: Uint8Array,
    rinfo: { address: string; port: number },
  ): void {
    let parsed: unknown;
    try {
      parsed = bdecode(data);
    } catch {
      return;
    }

    if (typeof parsed !== "object" || parsed === null) {
      return;
    }

    const msg = parsed as DHTMessage;
    if (!msg.t) {
      return;
    }
    const t = transactionIdToHex(msg.t);

    const pending = this.pendingRequests.get(t);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(t);
      pending.resolve(data);
    }

    for (const cb of this.messageCallbacks) {
      cb(msg, rinfo);
    }
  }

  async send(data: Uint8Array, address: string, port: number): Promise<void> {
    const sock = this.getSocket();
    return new Promise((resolve, reject) => {
      sock.send(data, port, address, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async sendWithTransaction(
    data: Uint8Array,
    address: string,
    port: number,
    timeout: number,
    transactionId: Uint8Array,
  ): Promise<Uint8Array> {
    const t = buf2hex(transactionId);
    const sock = this.getSocket();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(t);
        reject(new FetchLayerTimeoutError("bittorrent", timeout));
      }, timeout);

      this.pendingRequests.set(t, { resolve, reject, timer });

      sock.send(data, port, address, (err: Error | null) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(t);
          reject(err);
        }
      });
    });
  }

  onMessage(
    callback: (
      msg: DHTMessage,
      rinfo: { address: string; port: number },
    ) => void,
  ): void {
    this.messageCallbacks.push(callback);
  }

  close(): void {
    for (const [key, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Transceiver closed"));
    }
    this.pendingRequests.clear();
    if (this.socket) {
      this.getSocket().close();
    }
  }
}

class DHTClient {
  private transceiver: UDPTransceiver;
  private nodeId: Uint8Array;
  private infoHash: Uint8Array;
  private timeout: number;
  private bootstrapNodes: string[];

  constructor(
    infoHash: Uint8Array,
    timeout: number = DEFAULT_TIMEOUT,
    bootstrapNodes: string[] = BOOTSTRAP_NODES,
  ) {
    this.transceiver = new UDPTransceiver();
    this.nodeId = randomNodeId();
    this.infoHash = infoHash;
    this.timeout = timeout;
    this.bootstrapNodes = bootstrapNodes;
  }

  async initialize(): Promise<void> {
    await this.transceiver.bind();
  }

  async lookup(): Promise<Array<{ host: string; port: number }>> {
    const peers: Array<{ host: string; port: number }> = [];
    const contactedPeers: Set<string> = new Set();
    const contactedNodes: Set<string> = new Set();
    let closestNodes: DHTNode[] = [];

    for (const nodeAddr of this.bootstrapNodes) {
      const [address, portStr] = nodeAddr.split(":");
      const port = parseInt(portStr, 10);
      try {
        const response = await this.sendGetPeers(this.infoHash, address, port);
        if (response) {
          const nodes = this.extractNodes(response);
          closestNodes = this.mergeClosestNodes(
            closestNodes,
            nodes,
            this.infoHash,
          );

          const peerList = this.extractPeers(response);
          for (const peer of peerList) {
            const peerKey = `${peer.host}:${peer.port}`;
            if (!contactedPeers.has(peerKey)) {
              contactedPeers.add(peerKey);
              peers.push(peer);
            }
          }
        }
      } catch {
        // Continue to next bootstrap node
      }
    }

    let iterations = 0;
    const maxIterations = 8;

    while (iterations < maxIterations && closestNodes.length > 0) {
      const closest = closestNodes.slice(0, 3);

      const queries = closest.map(async (node) => {
        if (contactedNodes.has(`${node.address}:${node.port}`)) {
          return {
            nodes: [] as DHTNode[],
            peers: [] as Array<{ host: string; port: number }>,
          };
        }
        contactedNodes.add(`${node.address}:${node.port}`);

        try {
          const response = await this.sendGetPeers(
            this.infoHash,
            node.address,
            node.port,
          );
          if (response) {
            const discoveredNodes = this.extractNodes(response);
            const peerList = this.extractPeers(response);
            return { nodes: discoveredNodes, peers: peerList };
          }
        } catch {
          // Node failed, continue
        }
        return {
          nodes: [] as DHTNode[],
          peers: [] as Array<{ host: string; port: number }>,
        };
      });

      const results = await Promise.all(queries);

      let newNodes: DHTNode[] = [];
      for (const result of results) {
        newNodes.push(...result.nodes);
        for (const peer of result.peers) {
          const peerKey = `${peer.host}:${peer.port}`;
          if (!contactedPeers.has(peerKey)) {
            contactedPeers.add(peerKey);
            peers.push(peer);
          }
        }
      }

      closestNodes = this.mergeClosestNodes(
        closestNodes,
        newNodes,
        this.infoHash,
      );
      iterations++;
    }

    return peers;
  }

  private async sendGetPeers(
    infoHash: Uint8Array,
    address: string,
    port: number,
  ): Promise<Record<string, unknown> | null> {
    const transactionId = DHTTransactionId.generate();
    const query = createGetPeersQuery(infoHash, transactionId);

    try {
      const responseData = await this.transceiver.sendWithTransaction(
        query,
        address,
        port,
        this.timeout,
        transactionId,
      );
      const parsed = bdecode(responseData) as DHTMessage;

      if (parsed.y === "r" && parsed.r) {
        return parsed.r as Record<string, unknown>;
      }
    } catch {
      // Request failed
    }

    return null;
  }

  private extractNodes(response: Record<string, unknown>): DHTNode[] {
    const nodes = response.nodes;
    if (typeof nodes === "string" || nodes instanceof Uint8Array) {
      return parseNodes(nodes);
    }
    return [];
  }

  private extractPeers(
    response: Record<string, unknown>,
  ): Array<{ host: string; port: number }> {
    const peers = response.values;
    if (peers) {
      return parsePeers(peers as unknown);
    }
    return [];
  }

  private mergeClosestNodes(
    existing: DHTNode[],
    newNodes: DHTNode[],
    target: Uint8Array,
  ): DHTNode[] {
    const allNodes = [...existing, ...newNodes];
    allNodes.sort((a, b) => {
      const distA = xorDistance(target, a.id);
      const distB = xorDistance(target, b.id);
      for (let i = 0; i < distA.length; i++) {
        if (distA[i] !== distB[i]) {
          return distA[i] - distB[i];
        }
      }
      return 0;
    });

    return allNodes.slice(0, 8);
  }

  close(): void {
    this.transceiver.close();
  }
}

async function fetchFromPeer(
  peer: { host: string; port: number },
  infoHash: Uint8Array,
  timeout: number,
  onProgress?: (bytes: number) => void,
): Promise<Uint8Array> {
  const net = (await getNet()) as { Socket: new () => unknown };

  return new Promise((resolve, reject) => {
    const socket = new net.Socket() as unknown as {
      connect(port: number, host: string, callback?: () => void): unknown;
      write(data: Uint8Array, callback?: (err?: Error) => void): boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on(event: string, callback: any): unknown;
      destroy(): void;
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    let handshakeReceived = false;
    let amChoking = true;
    let amInterested = false;
    let peerChoking = true;
    let peerInterested = false;
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
      clearTimeout(timeoutId);
      if (!isClosed) {
        isClosed = true;
        socket.destroy();
      }
    };

    const queueRequest = () => {
      if (amInterested && !peerChoking) {
        const requestMsg = createRequestMessage(
          currentPieceIndex,
          currentOffset,
          BLOCK_SIZE,
        );
        socket.write(requestMsg);
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new FetchLayerTimeoutError("bittorrent", timeout));
    }, timeout);

    socket.connect(peer.port, peer.host, () => {
      isConnected = true;
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        cleanup();
        if (downloadedPieces.size > 0) {
          const total = assemblePieces(downloadedPieces);
          onProgress?.(total.length);
          resolve(total);
        } else {
          reject(new FetchLayerTimeoutError("bittorrent", timeout));
        }
      }, timeout);

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
          peerInterested = true;
          break;
        case MessageId.NOT_INTERESTED:
          peerInterested = false;
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
            clearTimeout(timeoutId);
            // Note: 5-second inactivity timeout between pieces is intentional and distinct
            // from the overall operation timeout. This allows slow peers to complete transfers
            // while still detecting when the peer has stopped sending data.
            timeoutId = setTimeout(() => {
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
      clearTimeout(timeoutId);
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

function assemblePieces(
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
    if (sortedBlocks.length === 1) {
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

export {
  parsePeers,
  parseNodes,
  xorDistance,
  buf2hex,
  hex2buf,
  transactionIdToHex,
  verifySha1,
  randomNodeId,
  createGetPeersQuery,
  DHTClient,
  UDPTransceiver,
  DHTNode,
  DHTMessage,
  fetchFromPeer,
};
