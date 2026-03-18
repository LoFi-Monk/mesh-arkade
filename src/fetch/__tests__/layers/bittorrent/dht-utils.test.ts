import { describe, it, expect, vi } from "vitest";
import {
  xorDistance,
  createGetPeersQuery,
  randomNodeId,
  DHTTransactionId,
  buf2hex,
  hex2buf,
  transactionIdToHex,
  parsePeers,
} from "../../../layers/bittorrent.js";

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
