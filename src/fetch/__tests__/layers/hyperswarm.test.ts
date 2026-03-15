import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFromHyperswarm } from "../../layers/hyperswarm.js";
import { FetchLayerTimeoutError, FetchLayerError } from "../../errors.js";

vi.mock("hyperswarm", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        join: vi.fn().mockReturnValue({
          flushed: vi.fn().mockResolvedValue(undefined),
        }),
        on: vi.fn(),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("fetchFromHyperswarm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Timeout fires before any peer connects: throws FetchLayerTimeoutError", async () => {
    await expect(
      fetchFromHyperswarm("abc123def456789012345678901234567890abcd", {
        timeout: 50,
      }),
    ).rejects.toThrow(FetchLayerTimeoutError);
  });

  it("Peer connects and streams data: resolves with correct Uint8Array", async () => {
    const testData = Buffer.from([1, 2, 3, 4, 5]);

    const mockConnection = {
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "data") {
          setTimeout(() => cb(testData), 10);
        }
        if (event === "end") {
          setTimeout(() => cb(), 20);
        }
      }),
      end: vi.fn(),
    };

    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockResolvedValue(undefined),
      }),
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    const result = await fetchFromHyperswarm(
      "abc123def456789012345678901234567890abcd",
      { timeout: 5000 },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
  });

  it("onProgress callback fires with byte count", async () => {
    const testData1 = Buffer.from([1, 2, 3]);
    const testData2 = Buffer.from([4, 5]);

    const mockConnection = {
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "data") {
          setTimeout(() => cb(testData1), 10);
          setTimeout(() => cb(testData2), 30);
        }
        if (event === "end") {
          setTimeout(() => cb(), 50);
        }
      }),
      end: vi.fn(),
    };

    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockResolvedValue(undefined),
      }),
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    const progressCalls: number[] = [];
    const result = await fetchFromHyperswarm(
      "abc123def456789012345678901234567890abcd",
      {
        timeout: 5000,
        onProgress: (bytes: number) => {
          progressCalls.push(bytes);
        },
      },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(progressCalls.length).toBeGreaterThan(0);
  });

  it("Peer connects but stream emits error: rejects with FetchLayerError", async () => {
    const mockConnection = {
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
        if (event === "error") {
          setTimeout(() => cb(new Error("Connection reset by peer")), 20);
        }
        if (event === "end") {
          setTimeout(() => cb(), 30);
        }
      }),
      end: vi.fn(),
    };

    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockResolvedValue(undefined),
      }),
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    await expect(
      fetchFromHyperswarm("abc123def456789012345678901234567890abcd", {
        timeout: 5000,
      }),
    ).rejects.toThrow(FetchLayerError);
  });

  it("Peer connects but stream ends with 0 bytes: resolves with empty Uint8Array", async () => {
    const mockConnection = {
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
        if (event === "end") {
          setTimeout(() => cb(), 20);
        }
      }),
      end: vi.fn(),
    };

    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockResolvedValue(undefined),
      }),
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "connection") {
          setTimeout(() => cb(mockConnection), 10);
        }
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    const result = await fetchFromHyperswarm(
      "abc123def456789012345678901234567890abcd",
      { timeout: 5000 },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });
});
