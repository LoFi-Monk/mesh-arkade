import { describe, it, expect } from "vitest";
import { bencode, bdecode } from "../../../layers/bittorrent.js";

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
