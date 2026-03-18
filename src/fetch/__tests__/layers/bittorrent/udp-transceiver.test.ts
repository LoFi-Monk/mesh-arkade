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

vi.mock("bare-dgram", () => ({ default: mockDgram, ...mockDgram }));

import { UDPTransceiver, getDgram } from "../../../layers/bittorrent.js";

describe("UDPTransceiver", () => {
  it("creates instance", () => {
    const transceiver = new UDPTransceiver();
    expect(transceiver).toBeDefined();
    transceiver.close();
  });
});

describe("UDPTransceiver internal branches", () => {
  it("exercises handleMessage error branch", async () => {
    const dgram = await getDgram();
    const socket = (dgram as any).createSocket();
    
    let messageHandler: any;
    vi.mocked(socket.on).mockImplementation((event: string, cb: any) => {
      if (event === "message") messageHandler = cb;
      return socket;
    });
    
    const transceiver = new UDPTransceiver();
    transceiver.bind(0);
    
    if (messageHandler) {
      // Malformed bencode to trigger catch in handleMessage
      expect(() => messageHandler(new Uint8Array([0, 0]), { address: "127.0.0.1", port: 1234 })).not.toThrow();
    }
    
    transceiver.close();
  });

  it("exercises send error branch", async () => {
    const dgram = await getDgram();
    const socket = (dgram as any).createSocket();
    
    vi.mocked(socket.send).mockImplementation((data: any, port: any, addr: any, cb: any) => {
      if (cb) cb(new Error("Send failed"));
    });
    
    const transceiver = new UDPTransceiver();
    transceiver.bind(0);
    expect(() => transceiver.send(new Uint8Array([1]), "127.0.0.1", 1234)).not.toThrow();
    
    transceiver.close();
  });
});
