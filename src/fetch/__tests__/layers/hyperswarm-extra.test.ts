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

describe("fetchFromHyperswarm Extra Branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when peer stream emits error", async () => {
    const mockConnection = {
      on: vi.fn().mockImplementation((event: string, cb: Function) => {
        if (event === "error") {
          setTimeout(() => cb(new Error("Stream error")), 10);
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

  it("uses default timeout when not provided", async () => {
    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockResolvedValue(undefined),
      }),
      on: vi.fn(), // never connects
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    // Provide fake timers to speed up the 30s default timeout
    vi.useFakeTimers();
    
    const promise = expect(fetchFromHyperswarm("abc123def456789012345678901234567890abcd")).rejects.toThrow(FetchLayerTimeoutError);
    
    await vi.advanceTimersByTimeAsync(31000); // Wait out the 30s default timeout

    await promise;
    
    vi.useRealTimers();
  });

  it("handles discovery.flushed() rejection", async () => {
    const Hyperswarm = (await import("hyperswarm")).default as any;
    const mockSwarm = {
      join: vi.fn().mockReturnValue({
        flushed: vi.fn().mockRejectedValue(new Error("Discovery failed")),
      }),
      on: vi.fn(),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Hyperswarm.mockImplementation(() => mockSwarm);

    await expect(
      fetchFromHyperswarm("abc123def456789012345678901234567890abcd", { timeout: 100 }),
    ).rejects.toThrow("Discovery failed");
  });
});
