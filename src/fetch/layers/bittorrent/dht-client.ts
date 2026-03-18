/**
 * @file dht-client.ts
 * @description DHT client for BitTorrent peer discovery using info hash lookup.
 */

import { UDPTransceiver } from "./udp-transceiver.js";
import {
  DHTNode,
  DHTMessage,
  randomNodeId,
  createGetPeersQuery,
  DHTTransactionId,
  parseNodes,
  parsePeers,
  xorDistance,
} from "./dht-utils.js";
import { bdecode } from "./bencode.js";

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
 * @intent DHT client for BitTorrent peer discovery using info hash lookup.
 * @guarantee Returns array of peer addresses found via DHT get_peers queries.
 * @constraint Must call initialize() before lookup(). Must call close() to release resources.
 *             Uses SHA1 as info hash for custom P2P mesh (not standard BitTorrent network).
 */
export class DHTClient {
  private transceiver: UDPTransceiver;
  private infoHash: Uint8Array;
  private timeout: number;
  private bootstrapNodes: string[];

  constructor(
    infoHash: Uint8Array,
    timeout: number = DEFAULT_TIMEOUT,
    bootstrapNodes: string[] = BOOTSTRAP_NODES,
  ) {
    this.transceiver = new UDPTransceiver();
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
      contactedNodes.add(nodeAddr);
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
    const seen = new Set<string>();
    const uniqueNodes = allNodes.filter((node) => {
      const key = `${node.address}:${node.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    uniqueNodes.sort((a, b) => {
      const distA = xorDistance(target, a.id);
      const distB = xorDistance(target, b.id);
      for (let i = 0; i < distA.length; i++) {
        if (distA[i] !== distB[i]) {
          return distA[i] - distB[i];
        }
      }
      return 0;
    });

    return uniqueNodes.slice(0, 8);
  }

  close(): void {
    this.transceiver.close();
  }
}
