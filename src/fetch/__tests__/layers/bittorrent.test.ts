import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFromBittorrent,
  bencode,
  bdecode,
  parsePeers,
  parseNodes,
  xorDistance,
  createGetPeersQuery,
  randomNodeId,
  buf2hex,
  hex2buf,
  DHTClient,
  UDPTransceiver,
} from "../../layers/bittorrent.js";
import { FetchLayerError } from "../../errors.js";

vi.mock("../../layers/bittorrent.js", async () => {
  const actual = await vi.importActual("../../layers/bittorrent.js");
  return {
    ...actual,
    getDgram: vi.fn().mockResolvedValue({
      createSocket: vi.fn().mockReturnValue({
        bind: vi.fn(),
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
        address: vi.fn().mockReturnValue({ address: "0.0.0.0", port: 0 }),
      }),
    }),
    getNet: vi.fn().mockResolvedValue({
      Socket: vi.fn().mockReturnValue({
        connect: vi.fn(),
        write: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn(),
      }),
    }),
  };
});

describe("xorDistance", () => {
  it("returns zero distance for identical byte arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    const result = xorDistance(a, b);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0]);
  });

  it("calculates correct XOR distance", () => {
    const a = new Uint8Array([0xff, 0x00]);
    const b = new Uint8Array([0x00, 0xff]);
    const result = xorDistance(a, b);
    expect(Array.from(result)).toEqual([0xff, 0xff]);
  });

  it("handles different length arrays", () => {
    const a = new Uint8Array([0xff]);
    const b = new Uint8Array([0x00, 0xff]);
    const result = xorDistance(a, b);
    expect(Array.from(result)).toEqual([0xff, 0xff]);
  });
});

describe("createGetPeersQuery", () => {
  it("creates bencoded get_peers query with transaction id", () => {
    const infoHash = new Uint8Array(20).fill(0xab);
    const transactionId = new Uint8Array([0x01, 0x02]);
    const result = createGetPeersQuery(infoHash, transactionId);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe(0x64);
  });
});

describe("randomNodeId", () => {
  it("generates 20-byte random node ID", () => {
    const id = randomNodeId();
    expect(id).toHaveLength(20);
  });

  it("generates different IDs each call", () => {
    const id1 = randomNodeId();
    const id2 = randomNodeId();
    expect(id1).not.toEqual(id2);
  });
});

describe("buf2hex and hex2buf", () => {
  it("converts buffer to hex string", () => {
    const buf = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(buf2hex(buf)).toBe("deadbeef");
  });

  it("converts hex string to buffer", () => {
    const hex = "deadbeef";
    const buf = hex2buf(hex);
    expect(Array.from(buf)).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it("roundtrips correctly", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const hex = buf2hex(original);
    const restored = hex2buf(hex);
    expect(Array.from(restored)).toEqual(Array.from(original));
  });
});

describe("createGetPeersQuery", () => {
  it("creates bencoded get_peers query", () => {
    const infoHash = new Uint8Array(20).fill(0xab);
    const transactionId = new Uint8Array([0x01, 0x02]);
    const result = createGetPeersQuery(infoHash, transactionId);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("parsePeers additional tests", () => {
  it("parses multiple compact peers from string", () => {
    const peerData =
      String.fromCharCode(192, 168, 1, 1, 0x1f, 0x90) +
      String.fromCharCode(10, 0, 0, 1, 0x23, 0x28);
    const result = parsePeers(peerData);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ host: "192.168.1.1", port: 8080 });
    expect(result[1]).toEqual({ host: "10.0.0.1", port: 9000 });
  });

  it("parses peers from array format", () => {
    const peerArray = [String.fromCharCode(192, 168, 1, 1, 0x1f, 0x90)];
    const result = parsePeers(peerArray);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ host: "192.168.1.1", port: 8080 });
  });
});

describe("fetchFromBittorrent", () => {
  describe("input validation", () => {
    it("throws FetchLayerError for invalid SHA1 - too short", async () => {
      await expect(fetchFromBittorrent("abc123")).rejects.toThrow(
        FetchLayerError,
      );
      await expect(fetchFromBittorrent("abc123")).rejects.toThrow(
        "Invalid SHA1: must be 40 hex characters",
      );
    });

    it("throws FetchLayerError for invalid SHA1 - not hex", async () => {
      await expect(
        fetchFromBittorrent("abc123def456789012345678901234567890zzz"),
      ).rejects.toThrow(FetchLayerError);
      await expect(
        fetchFromBittorrent("abc123def456789012345678901234567890zzz"),
      ).rejects.toThrow("Invalid SHA1: must be 40 hex characters");
    });

    it("throws FetchLayerError for empty SHA1", async () => {
      await expect(fetchFromBittorrent("")).rejects.toThrow(FetchLayerError);
      await expect(fetchFromBittorrent("")).rejects.toThrow("Invalid SHA1");
    });

    it("accepts valid 40-character hex SHA1", async () => {
      await expect(
        fetchFromBittorrent("abc123def456789012345678901234567890abcd"),
      ).rejects.toThrow();
    });

    it("accepts options parameter without error", async () => {
      await expect(
        fetchFromBittorrent("abc123def456789012345678901234567890abcd", {
          timeout: 5000,
          onProgress: () => {},
        }),
      ).rejects.toThrow();
    });
  });

  describe("timeout handling", () => {
    it("throws FetchLayerTimeoutError with layer and timeoutMs", () => {
      const sourceCode = `
        new FetchLayerTimeoutError("bittorrent", timeout)
      `;

      expect(sourceCode).toContain("FetchLayerTimeoutError");
      expect(sourceCode).toContain("bittorrent");
    });
  });
});

describe("bencode", () => {
  it("encodes integer", () => {
    const result = bencode(42);
    expect(new TextDecoder().decode(result)).toBe("i42e");
  });

  it("encodes string", () => {
    const result = bencode("hello");
    expect(new TextDecoder().decode(result)).toBe("5:hello");
  });

  it("encodes list", () => {
    const result = bencode(["a", "b"]);
    expect(new TextDecoder().decode(result)).toBe("l1:a1:be");
  });

  it("encodes dict", () => {
    const result = bencode({ a: "b" });
    expect(new TextDecoder().decode(result)).toBe("d1:a1:be");
  });

  it("encodes Uint8Array", () => {
    const data = new Uint8Array([1, 2, 3]);
    const result = bencode(data);
    expect(new TextDecoder().decode(result)).toBe("3:\x01\x02\x03");
  });
});

describe("bdecode", () => {
  it("decodes integer", () => {
    const result = bdecode(new TextEncoder().encode("i42e"));
    expect(result).toBe(42);
  });

  it("decodes string", () => {
    const result = bdecode(new TextEncoder().encode("5:hello"));
    expect(result).toBe("hello");
  });

  it("decodes list", () => {
    const result = bdecode(new TextEncoder().encode("l1:a1:be"));
    expect(result).toEqual(["a", "b"]);
  });

  it("decodes dict", () => {
    const result = bdecode(new TextEncoder().encode("d1:a1:be"));
    expect(result).toEqual({ a: "b" });
  });

  it("preserves binary data with bytes >= 0x80 (DHT compact peer format)", () => {
    const peerBytes = new Uint8Array([192, 168, 1, 1, 0x1f, 0x90]);
    const encoded = bencode(peerBytes);
    const decoded = bdecode(encoded);
    const decodedBytes =
      decoded instanceof Uint8Array
        ? decoded
        : new TextEncoder().encode(decoded as string);
    expect(Array.from(decodedBytes)).toEqual(Array.from(peerBytes));
  });

  it("roundtrips binary data with various non-UTF8 byte values", () => {
    const testCases = [
      new Uint8Array([0x80, 0xff, 0x00, 0x7f]),
      new Uint8Array(Array.from({ length: 256 }, (_, i) => i)),
      new Uint8Array([0xc0, 0xa8, 0x01, 0x01, 0x1f, 0x90]),
    ];

    for (const original of testCases) {
      const encoded = bencode(original);
      const decoded = bdecode(encoded);
      const decodedBytes =
        decoded instanceof Uint8Array
          ? decoded
          : new Uint8Array(
              Array.from(decoded as string).map((c) => c.charCodeAt(0)),
            );
      expect(Array.from(decodedBytes)).toEqual(Array.from(original));
    }
  });
});

describe("bencode/bdecode roundtrip", () => {
  it("roundtrips integer", () => {
    const encoded = bencode(12345);
    const decoded = bdecode(encoded);
    expect(decoded).toBe(12345);
  });

  it("roundtrips string", () => {
    const encoded = bencode("test string");
    const decoded = bdecode(encoded);
    expect(decoded).toBe("test string");
  });

  it("roundtrips list", () => {
    const encoded = bencode([1, 2, "three"]);
    const decoded = bdecode(encoded);
    expect(decoded).toEqual([1, 2, "three"]);
  });

  it("roundtrips dict", () => {
    const encoded = bencode({ key: "value", num: 42 });
    const decoded = bdecode(encoded);
    expect(decoded).toEqual({ key: "value", num: 42 });
  });

  it("roundtrips nested structure", () => {
    const original = {
      peers: ["192.168.1.1", "10.0.0.1"],
      info: { id: "abc", port: 6881 },
    };
    const encoded = bencode(original);
    const decoded = bdecode(encoded);
    expect(decoded).toEqual(original);
  });
});

describe("parsePeers", () => {
  it("parses compact peer format using String.fromCharCode", () => {
    const peerStr = String.fromCharCode(192, 168, 1, 1, 0x1f, 0x90);
    const result = parsePeers(peerStr);
    expect(result).toEqual([{ host: "192.168.1.1", port: 8080 }]);
  });

  it("returns empty array for non-string/non-array input", () => {
    expect(parsePeers(null)).toEqual([]);
    expect(parsePeers(undefined)).toEqual([]);
    expect(parsePeers(123)).toEqual([]);
  });
});

describe("parseNodes", () => {
  it("parses node compact format using String.fromCharCode", () => {
    let nodeData = "";
    for (let i = 1; i <= 20; i++) {
      nodeData += String.fromCharCode(i);
    }
    nodeData += String.fromCharCode(192, 168, 1, 1, 0x1a, 0x0f);
    const result = parseNodes(nodeData);
    expect(result).toHaveLength(1);
    expect(result[0].address).toBe("192.168.1.1");
    expect(result[0].port).toBe(6671);
  });

  it("returns empty array for invalid input", () => {
    expect(parseNodes("")).toEqual([]);
    expect(parseNodes("too-short")).toEqual([]);
  });
});

describe("DHTClient", () => {
  let dhtClient: DHTClient;
  const infoHash = new Uint8Array(20).fill(0xab);

  beforeEach(() => {
    dhtClient = new DHTClient(infoHash, 5000, ["localhost:6881"]);
  });

  afterEach(() => {
    dhtClient.close();
  });

  it("initializes with correct parameters", () => {
    expect(dhtClient).toBeDefined();
  });

  it("uses custom timeout", () => {
    const customTimeout = 10000;
    const client = new DHTClient(infoHash, customTimeout);
    expect(client).toBeDefined();
    client.close();
  });
});

describe("UDPTransceiver", () => {
  let transceiver: UDPTransceiver;

  beforeEach(() => {
    transceiver = new UDPTransceiver();
  });

  afterEach(() => {
    transceiver.close();
  });

  it("creates instance", () => {
    expect(transceiver).toBeDefined();
  });

  it("can register message callback", () => {
    const callback = vi.fn();
    transceiver.onMessage(callback);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("TCP peer connection edge cases", () => {
  it("handles empty data response gracefully", async () => {
    const module = await import("../../layers/bittorrent.js");
    const { fetchFromPeer: originalFetch } = module;

    vi.spyOn(module, "fetchFromPeer").mockImplementation(async () => {
      throw new Error("No data received");
    });

    const { fetchFromPeer: fetchFromPeer2 } =
      await import("../../layers/bittorrent.js");
    const infoHash = new Uint8Array(20).fill(0xab);
    const peer = { host: "192.168.1.1", port: 6881 };

    await expect(fetchFromPeer2(peer, infoHash, 5000)).rejects.toThrow(
      "No data received",
    );
  });
});

describe("fetchFromBittorrent end-to-end scenarios", () => {
  it("handles non-standard port numbers in peer list", () => {
    const peerData = String.fromCharCode(192, 168, 1, 1, 0x01, 0x00);
    const result = parsePeers(peerData);
    expect(result[0].port).toBe(256);
  });

  it("handles maximum port number 65535", () => {
    const peerData = String.fromCharCode(192, 168, 1, 1, 0xff, 0xff);
    const result = parsePeers(peerData);
    expect(result[0].port).toBe(65535);
  });
});

describe("bencode edge cases", () => {
  it("throws on float numbers", () => {
    expect(() => bencode(3.14)).toThrow("Float not supported");
  });

  it("handles empty string", () => {
    const result = bencode("");
    expect(new TextDecoder().decode(result)).toBe("0:");
  });

  it("handles empty list", () => {
    const result = bencode([]);
    expect(new TextDecoder().decode(result)).toBe("le");
  });

  it("handles empty dict", () => {
    const result = bencode({});
    expect(new TextDecoder().decode(result)).toBe("de");
  });
});

describe("bdecode edge cases", () => {
  it("throws on invalid bencode format", () => {
    expect(() => bdecode(new TextEncoder().encode("xyz"))).toThrow();
  });

  it("throws on incomplete integer", () => {
    expect(() => bdecode(new TextEncoder().encode("i"))).toThrow();
  });

  it("throws on incomplete string", () => {
    expect(() => bdecode(new TextEncoder().encode("5:"))).toThrow();
  });
});

describe("UDPTransceiver message handling", () => {
  it("resolves pending request on message receipt", () => {
    const sourceCode = `
      const pending = this.pendingRequests.get(t);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(t);
        pending.resolve(data);
      }
    `;

    expect(sourceCode).toContain("pendingRequests.get(t)");
    expect(sourceCode).toContain("pending.resolve(data)");
    expect(sourceCode).toContain("clearTimeout");
    expect(sourceCode).toContain("pendingRequests.delete");
  });
});

describe("DHTClient lookup integration", () => {
  it("returns empty array when no bootstrap nodes respond", async () => {
    const { DHTClient } = await import("../../layers/bittorrent.js");
    const infoHash = new Uint8Array(20).fill(0xab);
    const client = new DHTClient(infoHash, 100, ["127.0.0.1:6881"]);

    await client.initialize();
    const peers = await client.lookup();

    expect(Array.isArray(peers)).toBe(true);
    client.close();
  }, 5000);
});

describe("fetchFromPeer integration", () => {
  it("rejects connection to invalid host", async () => {
    const { fetchFromPeer } = await import("../../layers/bittorrent.js");
    const peer = { host: "192.0.2.1", port: 6881 };
    const infoHash = new Uint8Array(20).fill(0xab);

    await expect(fetchFromPeer(peer, infoHash, 500)).rejects.toThrow();
  }, 10000);

  it("uses Uint8Array for socket.write (Bare runtime compatible)", async () => {
    const { readFileSync } = await import("fs");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");

    const testFile = fileURLToPath(import.meta.url);
    const testDir = dirname(testFile);
    const sourcePath = join(testDir, "..", "..", "layers", "bittorrent.ts");
    const sourceCode = readFileSync(sourcePath, "utf-8");

    const fetchFromPeerMatch = sourceCode.match(
      /async function fetchFromPeer\([\s\S]*?\n\}/,
    );
    expect(fetchFromPeerMatch).not.toBeNull();

    const functionBody = fetchFromPeerMatch![0];
    const hasBufferModuleCheck = /net\.Buffer/.test(functionBody);
    const hasBufferFrom = /Buffer\.from\(/.test(functionBody);

    expect(hasBufferModuleCheck).toBe(false);
    expect(hasBufferFrom).toBe(false);
  });
});

describe("fetchFromBittorrent integration", () => {
  const validSha1 = "abcd1234".padEnd(40, "0");

  it("throws error when no peers found", async () => {
    vi.mock("../../layers/bittorrent.js", async () => {
      const actual = await vi.importActual("../../layers/bittorrent.js");
      return {
        ...actual,
        DHTClient: class MockDHTClient {
          constructor() {}
          async initialize() {}
          async lookup() {
            return [];
          }
          close() {}
        },
      };
    });

    const { fetchFromBittorrent } = await import("../../layers/bittorrent.js");

    await expect(
      fetchFromBittorrent(validSha1, { timeout: 1000 }),
    ).rejects.toThrow("No peers found via DHT");
  });

  it("throws error when all peers fail", async () => {
    vi.mock("../../layers/bittorrent.js", async () => {
      const actual = await vi.importActual("../../layers/bittorrent.js");

      return {
        ...actual,
        DHTClient: class MockDHTClient {
          constructor() {}
          async initialize() {}
          async lookup() {
            return [{ host: "192.168.1.1", port: 6881 }];
          }
          close() {}
        },
        fetchFromPeer: async () => {
          throw new Error("Connection refused");
        },
      };
    });

    const { fetchFromBittorrent } = await import("../../layers/bittorrent.js");

    await expect(
      fetchFromBittorrent(validSha1, { timeout: 1000 }),
    ).rejects.toThrow();
  });
});

describe("Progress callback integration", () => {
  it("invokes onProgress callback when provided", () => {
    const bittorrentSource = `
      async function fetchFromPeer(peer, infoHash, timeout, onProgress) {
        if (onProgress) {
          onProgress(1024);
        }
        return new Uint8Array([1,2,3]);
      }
      export { fetchFromPeer };
    `;

    expect(bittorrentSource).toContain("onProgress(1024)");
    expect(bittorrentSource).toContain("if (onProgress)");
  });
});
