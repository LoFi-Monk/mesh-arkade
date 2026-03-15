import { describe, it, expect } from "vitest";
import {
  FetchLayerTimeoutError,
  FetchLayerError,
  AllLayersFailedError,
} from "../errors.js";

describe("FetchLayerTimeoutError", () => {
  it("constructor sets layer, timeoutMs, message, and name", () => {
    const error = new FetchLayerTimeoutError("hyperswarm", 30000);

    expect(error.layer).toBe("hyperswarm");
    expect(error.timeoutMs).toBe(30000);
    expect(error.message).toBe(
      "Fetch layer 'hyperswarm' timed out after 30000ms",
    );
    expect(error.name).toBe("FetchLayerTimeoutError");
  });
});

describe("FetchLayerError", () => {
  it("constructor sets layer, message, and name", () => {
    const cause = new Error("underlying error");
    const error = new FetchLayerError("ipfs", "Gateway returned 404", cause);

    expect(error.layer).toBe("ipfs");
    expect(error.message).toBe(
      "Fetch layer 'ipfs' failed: Gateway returned 404",
    );
    expect(error.name).toBe("FetchLayerError");
  });

  it("cause is accessible via Error.cause", () => {
    const cause = new Error("underlying error");
    const error = new FetchLayerError("ipfs", "Gateway returned 404", cause);

    expect(error.cause).toBe(cause);
  });

  it("works without cause", () => {
    const error = new FetchLayerError("bittorrent", "Network error");

    expect(error.layer).toBe("bittorrent");
    expect(error.message).toBe(
      "Fetch layer 'bittorrent' failed: Network error",
    );
    expect(error.cause).toBeUndefined();
  });
});

describe("AllLayersFailedError", () => {
  it("constructor sets errors array", () => {
    const errors = [
      { layer: "hyperswarm", error: "timeout" },
      { layer: "ipfs", error: "not found" },
      { layer: "bittorrent", error: "not implemented" },
    ];
    const error = new AllLayersFailedError(errors);

    expect(error.errors).toEqual(errors);
    expect(error.name).toBe("AllLayersFailedError");
  });

  it("message includes all layer names", () => {
    const errors = [
      { layer: "hyperswarm", error: "timeout" },
      { layer: "ipfs", error: "not found" },
    ];
    const error = new AllLayersFailedError(errors);

    expect(error.message).toContain("hyperswarm");
    expect(error.message).toContain("ipfs");
    expect(error.message).toContain("timeout");
    expect(error.message).toContain("not found");
  });
});
