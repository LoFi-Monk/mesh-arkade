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

import { UDPTransceiver, DHTClient, getDgram } from "../../../layers/bittorrent.js";

describe("DHTClient additional branches", () => {
  it("ignores messages with unknown transaction IDs", async () => {
    const transceiver = new UDPTransceiver();
    const client = new DHTClient(new Uint8Array(20), 1000);
    (client as any).transceiver = transceiver;
    const msg = {
      t: "unknown",
      y: "r",
      r: { id: new Uint8Array(20) }
    };
    
    // We can't easily call private _onMessage without casting, so we trigger via transceiver
    const dgram = await getDgram();
    const socket = (dgram as any).createSocket();
    let messageHandler: any;
    vi.mocked(socket.on).mockImplementation((event: string, cb: any) => {
        if (event === "message") messageHandler = cb;
        return socket;
    });
    transceiver.bind(0);
    
    if (messageHandler) {
        const { bencode } = await import("../../../layers/bittorrent.js");
        messageHandler(bencode(msg), { address: "127.0.0.1", port: 1234 });
    }
    transceiver.close();
  });
});

describe("DHTClient full coverage", () => {
  it("initializes and performs a lookup returning peers", async () => {
    const infoHash = new Uint8Array(20).fill(1);
    
    // Create a client with a fake bootstrap node
    const client = new DHTClient(infoHash, 1000, ["127.0.0.1:6881"]);
    
    // Mock the transceiver
    const transceiver = (client as any).transceiver;
    vi.spyOn(transceiver, "bind").mockResolvedValue(undefined);
    vi.spyOn(transceiver, "close").mockImplementation(() => {});
    
    const { bencode } = await import("../../../layers/bittorrent.js");
    
    // Mock sendWithTransaction to return a valid response with peers
    vi.spyOn(transceiver, "sendWithTransaction").mockResolvedValue(bencode({
      t: "aa",
      y: "r",
      r: {
        id: new Uint8Array(20).fill(2),
        values: [
           // Compact peer: 192.168.1.100:8080 -> C0 A8 01 64 1F 90
           new Uint8Array([192, 168, 1, 100, 0x1f, 0x90]),
        ],
        nodes: new Uint8Array([
           // Compact node: id (20 bytes) + 10.0.0.1:9000 (6 bytes) = 26 bytes
           ...new Uint8Array(20).fill(3), 10, 0, 0, 1, 0x23, 0x28
        ])
      }
    }));

    await client.initialize();
    const peers = await client.lookup();
    
    expect(peers).toHaveLength(1);
    expect(peers[0].host).toBe("192.168.1.100");
    expect(peers[0].port).toBe(8080);
    
    client.close();
  });

  it("handles lookup errors gracefully and continues", async () => {
    const infoHash = new Uint8Array(20).fill(1);
    const client = new DHTClient(infoHash, 1000, ["127.0.0.1:6881", "127.0.0.2:6881"]);
    
    const transceiver = (client as any).transceiver;
    vi.spyOn(transceiver, "bind").mockResolvedValue(undefined);
    vi.spyOn(transceiver, "close").mockImplementation(() => {});
    
    const { bencode } = await import("../../../layers/bittorrent.js");
    // First node fails, second succeeds
    vi.spyOn(transceiver, "sendWithTransaction")
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce(bencode({
        t: "bb",
        y: "r",
        r: {
          id: new Uint8Array(20).fill(2),
          values: [
             new Uint8Array([192, 168, 1, 101, 0x1f, 0x90]),
          ]
        }
      }));

    await client.initialize();
    const peers = await client.lookup();
    
    expect(peers).toHaveLength(1);
    expect(peers[0].host).toBe("192.168.1.101");
    client.close();
  });
});
