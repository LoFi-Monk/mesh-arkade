/**
 * @file layers/bittorrent.ts
 * @description BitTorrent DHT-based P2P fetch layer using SHA1 as info hash.
 * @constraint Uses bare-dgram for UDP and bare-net for TCP, compatible with Bare runtime.
 */

import { FetchLayerError, FetchLayerTimeoutError } from "../errors.js";

/**
 * @intent Configuration options for BitTorrent DHT fetch layer.
 * @guarantee Timeout defaults to 30 seconds if not specified.
 */
export interface BittorrentFetchOptions {
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

export const DEFAULT_TIMEOUT = 30000;

export const BOOTSTRAP_NODES = [
  "router.bittorrent.com:6881",
  "router.utorrent.com:6881",
  "dht.transmissionbt.com:6881",
];

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

export function bencode(data: unknown): Uint8Array {
  if (typeof data === "number") {
    if (Number.isInteger(data)) {
      return new TextEncoder().encode(`i${data}e`);
    }
    throw new Error("Float not supported in bencode");
  }

  if (typeof data === "string") {
    return new TextEncoder().encode(`${data.length}:${data}`);
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

export function bdecode(data: Uint8Array): unknown {
  const text = new TextDecoder("latin1").decode(data);
  let position = 0;

  function parse(): unknown {
    if (position >= text.length) {
      throw new Error("Unexpected end of input");
    }

    const char = text[position];

    if (char >= "0" && char <= "9") {
      return parseString();
    }

    if (char === "i") {
      return parseInt_();
    }

    if (char === "l") {
      return parseList();
    }

    if (char === "d") {
      return parseDict();
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  function parseString(): Uint8Array | string {
    const colonIndex = text.indexOf(":", position);
    if (colonIndex === -1) {
      throw new Error("Invalid string format");
    }
    const length = parseInt(text.substring(position, colonIndex), 10);
    const start = colonIndex + 1;
    const end = start + length;
    const result = text.substring(start, end);
    position = end;
    const hasHighBytes =
      result.charCodeAt(0) >= 256 ||
      Array.from(result).some((c) => c.charCodeAt(0) >= 0x80);
    if (hasHighBytes) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = result.charCodeAt(i) & 0xff;
      }
      return bytes;
    }
    return result;
  }

  function parseInt_(): number {
    position++;
    const endIndex = text.indexOf("e", position);
    if (endIndex === -1) {
      throw new Error("Invalid integer format");
    }
    const result = parseInt(text.substring(position, endIndex), 10);
    position = endIndex + 1;
    return result;
  }

  function parseList(): unknown[] {
    position++;
    const result: unknown[] = [];
    while (position < text.length && text[position] !== "e") {
      result.push(parse());
    }
    if (position >= text.length) {
      throw new Error("Unterminated list");
    }
    position++;
    return result;
  }

  function parseDict(): Record<string, unknown> {
    position++;
    const result: Record<string, unknown> = {};
    while (position < text.length && text[position] !== "e") {
      const key = parse() as string;
      const value = parse();
      result[key] = value;
    }
    if (position >= text.length) {
      throw new Error("Unterminated dict");
    }
    position++;
    return result;
  }

  const result = parse();
  if (position !== text.length) {
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
  t: Uint8Array;
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

function parsePeers(peers: unknown): Array<{ host: string; port: number }> {
  const result: Array<{ host: string; port: number }> = [];

  if (typeof peers === "string") {
    for (let i = 0; i < peers.length; i += 6) {
      if (i + 6 <= peers.length) {
        const s = peers.substring(i, i + 6);
        const peerBytes = [
          s.charCodeAt(0),
          s.charCodeAt(1),
          s.charCodeAt(2),
          s.charCodeAt(3),
          s.charCodeAt(4),
          s.charCodeAt(5),
        ];
        const ip = `${peerBytes[0]}.${peerBytes[1]}.${peerBytes[2]}.${peerBytes[3]}`;
        const port = (peerBytes[4] << 8) | peerBytes[5];
        result.push({ host: ip, port });
      }
    }
  } else if (Array.isArray(peers)) {
    for (const peer of peers) {
      if (typeof peer === "string" && peer.length >= 6) {
        const s = peer.substring(0, 6);
        const peerBytes = [
          s.charCodeAt(0),
          s.charCodeAt(1),
          s.charCodeAt(2),
          s.charCodeAt(3),
          s.charCodeAt(4),
          s.charCodeAt(5),
        ];
        const ip = `${peerBytes[0]}.${peerBytes[1]}.${peerBytes[2]}.${peerBytes[3]}`;
        const port = (peerBytes[4] << 8) | peerBytes[5];
        result.push({ host: ip, port });
      }
    }
  }

  return result;
}

function parseNodes(nodes: string): DHTNode[] {
  const result: DHTNode[] = [];
  for (let i = 0; i < nodes.length; i += 26) {
    if (i + 26 <= nodes.length) {
      const s = nodes.substring(i, i + 26);
      const nodeId = new Uint8Array(20);
      for (let j = 0; j < 20; j++) {
        nodeId[j] = s.charCodeAt(j);
      }
      const peerBytes = [
        s.charCodeAt(20),
        s.charCodeAt(21),
        s.charCodeAt(22),
        s.charCodeAt(23),
        s.charCodeAt(24),
        s.charCodeAt(25),
      ];
      const address = `${peerBytes[0]}.${peerBytes[1]}.${peerBytes[2]}.${peerBytes[3]}`;
      const port = (peerBytes[4] << 8) | peerBytes[5];
      result.push({ id: nodeId, address, port });
    }
  }
  return result;
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
      socket.bind(port, () => {
        const addr = socket.address();
        this.address = addr.address;
        this.port = addr.port;
        resolve({ address: this.address, port: this.port });
      });

      socket.on("error", (err: Error) => {
        reject(err);
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
    const t = buf2hex(msg.t);

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
          peers.push(...peerList);
        }
      } catch {
        // Continue to next bootstrap node
      }
    }

    let iterations = 0;
    const maxIterations = 8;

    while (iterations < maxIterations && closestNodes.length > 0) {
      const closest = closestNodes.slice(0, 3);
      closestNodes = [];

      const queries = closest.map(async (node) => {
        if (contactedNodes.has(`${node.address}:${node.port}`)) {
          return null;
        }
        contactedNodes.add(`${node.address}:${node.port}`);

        try {
          const response = await this.sendGetPeers(
            this.infoHash,
            node.address,
            node.port,
          );
          if (response) {
            const nodes = this.extractNodes(response);
            closestNodes.push(...nodes);

            const peerList = this.extractPeers(response);
            peers.push(...peerList);
          }
        } catch {
          // Node failed, continue
        }
        return null;
      });

      await Promise.all(queries);
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
    if (typeof nodes === "string") {
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

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.destroy();
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new FetchLayerTimeoutError("bittorrent", timeout));
    }, timeout);

    socket.connect(peer.port, peer.host, () => {
      clearTimeout(timeoutId);

      const requestBuffer = new Uint8Array(20);
      requestBuffer.set(infoHash, 0);

      socket.write(requestBuffer);
    });

    const chunks: Uint8Array[] = [];

    const handleData = (data: Uint8Array) => {
      const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
      chunks.push(arr);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cleanup();
        if (chunks.length > 0) {
          const total = concatenateUint8Arrays(chunks);
          onProgress?.(total.length);
          resolve(total);
        } else {
          reject(new FetchLayerError("bittorrent", "No data received"));
        }
      }, 5000);
    };

    socket.on("data", handleData);

    socket.on("error", (err: Error) => {
      cleanup();
      reject(
        new FetchLayerError(
          "bittorrent",
          `Peer connection error: ${err.message}`,
          err,
        ),
      );
    });

    socket.on("close", () => {
      if (chunks.length > 0) {
        const total = concatenateUint8Arrays(chunks);
        onProgress?.(total.length);
        resolve(total);
      }
    });
  });
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
  randomNodeId,
  createGetPeersQuery,
  DHTClient,
  UDPTransceiver,
  DHTNode,
  DHTMessage,
  fetchFromPeer,
};
