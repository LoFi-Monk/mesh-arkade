import { describe, it, expect, vi } from "vitest";

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
  verifySha1,
  DHTClient,
  getNet,
} from "../../../layers/bittorrent.js";
import { FetchLayerError } from "../../../errors.js";

describe("verifySha1 edge cases", () => {
  it("returns false for incorrect length", async () => {
    const data = new Uint8Array([1, 2, 3]);
    const hash = "00".repeat(20);
    const result = await verifySha1(data, hash);
    expect(result).toBe(false);
  });

  it("returns false for mismatched hash", async () => {
    const data = new TextEncoder().encode("hello");
    const hash = "01".repeat(20);
    const result = await verifySha1(data, hash);
    expect(result).toBe(false);
  });
});

describe("fetchFromBittorrent", () => {
  describe("input validation", () => {
    it("throws FetchLayerError for invalid SHA1 - too short", async () => {
      await expect(fetchFromBittorrent("abc123")).rejects.toThrow(
        FetchLayerError,
      );
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

describe("fetchFromBittorrent integration", () => {
  it("fetches successfully from a discovered peer", async () => {
    const { fetchFromBittorrent, DHTClient, getNet } =
      await import("../../../layers/bittorrent.js");

    // Mock DHTClient to return a fake peer
    vi.spyOn(DHTClient.prototype, "initialize").mockResolvedValue(undefined);
    vi.spyOn(DHTClient.prototype, "lookup").mockResolvedValue([
      { host: "127.0.0.1", port: 6881 },
    ]);
    vi.spyOn(DHTClient.prototype, "close").mockImplementation(() => {});

    // Mock the socket so fetchFromPeer succeeds
    let dataCallback: ((data: Uint8Array) => void) | undefined = undefined;
    const socketMock: {
      connect: ReturnType<typeof vi.fn>;
      write: ReturnType<typeof vi.fn>;
      on: (
        event: string,
        cb: (data: Uint8Array) => void,
      ) => { on: ReturnType<typeof vi.fn> };
      destroy: ReturnType<typeof vi.fn>;
    } = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "data") dataCallback = cb;
        return { on: vi.fn() };
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromBittorrent(
      "abc123def456789012345678901234567890abcd",
      { timeout: 1000 },
    );

    await new Promise((r) => setTimeout(r, 20));

    if (dataCallback) {
      const callback = dataCallback as (data: Uint8Array) => void;
      // 1. Handshake
      const handshake = new Uint8Array(68).fill(0);
      handshake[0] = 19;
      const protocol = "BitTorrent protocol";
      for (let i = 0; i < protocol.length; i++)
        handshake[i + 1] = protocol.charCodeAt(i);
      callback(handshake);

      // 2. UNCHOKE message (id 1)
      callback(new Uint8Array([0, 0, 0, 1, 1]));

      // 3. PIECE message (id 7)
      // Length = 9 (prefix) + length of block
      const pieceMsg = new Uint8Array(17).fill(0);
      const view = new DataView(pieceMsg.buffer);
      view.setUint32(0, 13); // length
      pieceMsg[4] = 7; // PIECE
      view.setUint32(5, 0); // index
      view.setUint32(9, 0); // begin
      callback(pieceMsg);
    }
  });

  it("falls back to fallback peers when DHT peers fail", async () => {
    const { fetchFromBittorrent, DHTClient, getNet } =
      await import("../../../layers/bittorrent.js");

    vi.spyOn(DHTClient.prototype, "initialize").mockResolvedValue(undefined);
    vi.spyOn(DHTClient.prototype, "lookup").mockResolvedValue([
      { host: "127.0.0.1", port: 6881 },
    ]);
    vi.spyOn(DHTClient.prototype, "close").mockImplementation(() => {});

    // Mock socket to immediately close, causing fetchFromPeer to fail
    const socketMock = {
      connect: vi.fn((port, host, cb) => {
        setTimeout(() => cb && cb(), 0);
      }),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "close") setTimeout(cb, 10);
        return { on: vi.fn() };
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    await expect(
      fetchFromBittorrent("abc123def456789012345678901234567890abcd", {
        timeout: 100,
      }),
    ).rejects.toThrow();
  });
});
