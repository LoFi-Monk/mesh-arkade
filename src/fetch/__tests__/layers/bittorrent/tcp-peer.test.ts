import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("bare-net", () => ({ default: mockNet, ...mockNet }));

import { fetchFromPeer, assemblePieces, getNet, MessageId } from "../../../layers/bittorrent.js";

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

describe("fetchFromPeer additional error handlers", () => {
  it("exercises socket error branch", async () => {
    let errorCallback: any;
    const socketMock = {
      connect: vi.fn((port, host, cb) => setTimeout(() => cb && cb(), 0)),
      write: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === "error") errorCallback = cb;
        return { on: vi.fn() };
      }),
      destroy: vi.fn(),
    };

    const net = await getNet();
    vi.mocked((net as any).Socket).mockReturnValue(socketMock);

    const promise = fetchFromPeer({ host: "localhost", port: 6881 }, new Uint8Array(20), 1000);
    
    await new Promise(r => setTimeout(r, 20));
    
    if (errorCallback) {
      errorCallback(new Error("Socket error"));
    }
    
    await expect(promise).rejects.toThrow();
  });
});
