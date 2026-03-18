import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockDgram = {
  createSocket: vi.fn(() => ({
    bind: vi.fn((port: number, cb?: () => void) => {
      if (cb) cb();
    }),
    on: vi.fn(),
    send: vi.fn((data, port, address, cb) => {
      if (cb) cb(null);
    }),
    close: vi.fn(),
    address: vi.fn(() => ({ port: 12345, address: "127.0.0.1" })),
  })),
};

const mockNet = {
  Socket: vi.fn().mockImplementation(() => ({
    connect: vi.fn((port, host, cb) => {
      if (cb) cb();
    }),
    on: vi.fn(),
    write: vi.fn(),
    destroy: vi.fn(),
  })),
};

vi.mock("bare-dgram", () => ({ default: mockDgram, ...mockDgram }));
vi.mock("bare-net", () => ({ default: mockNet, ...mockNet }));
vi.mock("bare-fs", () => ({ default: require("fs") }));
vi.mock("bare-path", () => ({ default: require("path") }));
vi.mock("bare-os", () => ({ default: require("os") }));
vi.mock("bare-crypto", () => ({ default: require("crypto") }));

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
  transactionIdToHex,
  DHTClient,
  UDPTransceiver,
  DHTNode,
  DHTTransactionId,
  getDgram,
  getNet,
  MessageId,
  fetchFromPeer,
  assemblePieces,
  verifySha1,
} from "../../layers/bittorrent.js";
import { FetchLayerError } from "../../errors.js";

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

  it("uses Math.random fallback when crypto.getRandomValues is unavailable", () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", undefined);
    try {
      const id = randomNodeId();
      expect(id).toHaveLength(20);
    } finally {
      vi.stubGlobal("crypto", originalCrypto);
    }
  });
});

describe("DHTTransactionId.generate Math.random fallback", () => {
  it("uses Math.random fallback when crypto.getRandomValues is unavailable", () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", undefined);
    try {
      const id = DHTTransactionId.generate();
      expect(id).toHaveLength(2);
    } finally {
      vi.stubGlobal("crypto", originalCrypto);
    }
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

describe("transactionIdToHex", () => {
  it("converts Uint8Array transaction ID to hex", () => {
    expect(transactionIdToHex(new Uint8Array([0xab, 0xcd]))).toBe("abcd");
  });

  it("converts string transaction ID to hex (bdecode low-byte path)", () => {
    const strId = String.fromCharCode(0x01, 0x02);
    expect(transactionIdToHex(strId)).toBe("0102");
  });

  it("produces consistent hex for equivalent string and Uint8Array", () => {
    const bytes = new Uint8Array([0x41, 0x42]);
    const str = String.fromCharCode(0x41, 0x42);
    expect(transactionIdToHex(bytes)).toBe(transactionIdToHex(str));
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

  it("parses compact peers from Uint8Array (bdecode binary path)", () => {
    const peerData = new Uint8Array([
      192, 168, 1, 1, 0x1f, 0x90, 10, 0, 0, 1, 0x23, 0x28,
    ]);
    const result = parsePeers(peerData);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ host: "192.168.1.1", port: 8080 });
    expect(result[1]).toEqual({ host: "10.0.0.1", port: 9000 });
  });
});

describe("fetchFromBittorrent", () => {
  describe("input validation", () => {
    it("throws FetchLayerError for invalid SHA1 - too short", async () => {
      await expect(fetchFromBittorrent("abc123")).rejects.toThrow(FetchLayerError);
    });

    it("throws FetchLayerError for invalid SHA1 - not hex", async () => {
      await expect(
        fetchFromBittorrent("abc123def456789012345678901234567890zzz"),
      ).rejects.toThrow(FetchLayerError);
    });

    it("throws FetchLayerError for empty SHA1", async () => {
      await expect(fetchFromBittorrent("")).rejects.toThrow(FetchLayerError);
    });
  });

  describe("timeout handling", () => {
    it("respects custom timeout option", async () => {
      const validSha1 = "a".repeat(40);
      const start = Date.now();
      await expect(
        fetchFromBittorrent(validSha1, { timeout: 200 }),
      ).rejects.toThrow();
      expect(Date.now() - start).toBeLessThan(10000);
    });
  });
});

describe("bencode", () => {
  it("encodes integer", () => {
    expect(new TextDecoder().decode(bencode(42))).toBe("i42e");
  });

  it("encodes string", () => {
    expect(new TextDecoder().decode(bencode("hello"))).toBe("5:hello");
  });

  it("encodes list", () => {
    expect(new TextDecoder().decode(bencode(["a", "b"]))).toBe("l1:a1:be");
  });

  it("encodes dict", () => {
    expect(new TextDecoder().decode(bencode({ a: "b" }))).toBe("d1:a1:be");
  });
});

describe("bdecode", () => {
  it("decodes integer", () => {
    expect(bdecode(new TextEncoder().encode("i42e"))).toBe(42);
  });

  it("decodes string", () => {
    expect(bdecode(new TextEncoder().encode("5:hello"))).toBe("hello");
  });
});

describe("UDPTransceiver", () => {
  it("creates instance", () => {
    const transceiver = new UDPTransceiver();
    expect(transceiver).toBeDefined();
    transceiver.close();
  });
});

describe("fetchFromPeer internal branches", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("exercises invalid handshake branch", async () => {
    let dataCallback: any;
    const socketMock = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "data") dataCallback = cb;
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromPeer({ host: "localhost", port: 6881 }, new Uint8Array(20), 1000);
    
    await new Promise(r => setTimeout(r, 20));
    
    if (dataCallback) {
      dataCallback(new Uint8Array(68).fill(0));
    }
    await expect(promise).rejects.toThrow("Invalid handshake from peer");
  });

  it("exercises CHOKE and UNCHOKE message branches", async () => {
    let dataCallback: any;
    const socketMock = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "data") dataCallback = cb;
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromPeer({ host: "localhost", port: 6881 }, new Uint8Array(20), 1000);
    
    await new Promise(r => setTimeout(r, 20));
    
    // 1. Valid handshake
    const handshake = new Uint8Array(68).fill(0);
    handshake[0] = 19;
    const protocol = "BitTorrent protocol";
    for (let i = 0; i < protocol.length; i++) handshake[i + 1] = protocol.charCodeAt(i);
    if (dataCallback) {
      dataCallback(handshake);
      dataCallback(new Uint8Array([0, 0, 0, 1, MessageId.UNCHOKE]));
      dataCallback(new Uint8Array([0, 0, 0, 1, MessageId.CHOKE]));
    }

    socketMock.destroy();
    await expect(promise).rejects.toThrow();
  });

  it("exercises isClosed guard in socket handlers", async () => {
    let closeCallback: any;
    const socketMock = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "close") closeCallback = cb;
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromPeer({ host: "localhost", port: 6881 }, new Uint8Array(20), 1000);
    
    await new Promise(r => setTimeout(r, 20));
    
    if (closeCallback) {
      closeCallback();
      closeCallback(); 
    }

    await expect(promise).rejects.toThrow("Connection closed before data received");
  });

  it("exercises inactivity timer firing", async () => {
    vi.useFakeTimers();
    let dataCallback: any;
    const socketMock = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "data") dataCallback = cb;
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromPeer({ host: "localhost", port: 6881 }, new Uint8Array(20), 10000);
    
    await vi.advanceTimersByTimeAsync(20);

    // Valid handshake
    const handshake = new Uint8Array(68).fill(0);
    handshake[0] = 19;
    const protocol = "BitTorrent protocol";
    for (let i = 0; i < protocol.length; i++) handshake[i + 1] = protocol.charCodeAt(i);
    
    if (!dataCallback) {
       socketMock.on("data", (cb: any) => dataCallback = cb);
    }

    if (dataCallback) {
      dataCallback(handshake);
      const pieceMsg = new Uint8Array(17).fill(0);
      const view = new DataView(pieceMsg.buffer);
      view.setUint32(0, 13);
      pieceMsg[4] = MessageId.PIECE;
      view.setUint32(5, 0); 
      view.setUint32(9, 0); 
      dataCallback(pieceMsg);
    }

    await vi.advanceTimersByTimeAsync(5100);

    const data = await promise;
    expect(data.length).toBe(4); 
    
    vi.useRealTimers();
  });
});

describe("assemblePieces edge cases", () => {
  it("returns empty array for empty pieces map", () => {
    const pieces = new Map();
    expect(assemblePieces(pieces)).toHaveLength(0);
  });

  it("assembles pieces with single block at offset 0", () => {
    const pieces = new Map();
    pieces.set(0, [{ offset: 0, data: new Uint8Array([1, 2, 3, 4, 5]) }]);
    expect(Array.from(assemblePieces(pieces))).toEqual([1, 2, 3, 4, 5]);
  });
});
