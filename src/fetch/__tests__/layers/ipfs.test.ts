import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFromIpfs } from "../../layers/ipfs.js";
import { FetchLayerError, FetchLayerTimeoutError } from "../../errors.js";

vi.mock("../../../core/runtime.js", () => ({
  getFetch: vi.fn(),
}));

vi.mock("../../museum-map.js", () => ({
  lookupCid: vi.fn(),
}));

import { getFetch } from "../../../core/runtime.js";
import { lookupCid } from "../../museum-map.js";

describe("fetchFromIpfs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SHA1 not in museum map: throws FetchLayerError with 'not found in Museum Map'", async () => {
    vi.mocked(lookupCid).mockReturnValue(null);

    await expect(
      fetchFromIpfs("abc123def456789012345678901234567890abcd"),
    ).rejects.toThrow(FetchLayerError);
  });

  it("SHA1 in map, gateway returns 200: returns Uint8Array", async () => {
    vi.mocked(lookupCid).mockReturnValue("QmTestCid123456789");

    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const mockResponse = {
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(testData.buffer),
    };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(getFetch).mockResolvedValue(mockFetch);

    const result = await fetchFromIpfs(
      "abc123def456789012345678901234567890abcd",
    );

    expect(mockFetch).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("SHA1 in map, gateway returns 404: throws FetchLayerError", async () => {
    vi.mocked(lookupCid).mockReturnValue("QmTestCid123456789");

    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
    };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(getFetch).mockResolvedValue(mockFetch);

    await expect(
      fetchFromIpfs("abc123def456789012345678901234567890abcd"),
    ).rejects.toThrow(FetchLayerError);
  });
});
