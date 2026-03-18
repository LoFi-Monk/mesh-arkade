/**
 * @file bencode.ts
 * @description Bencode encoding and decoding utilities for BitTorrent DHT protocol.
 */

/**
 * @intent Encodes JavaScript data into Bencode format for BitTorrent DHT protocol.
 * @param data - The data to encode (string, number, Uint8Array, array, or object).
 * @returns The Bencode-encoded data as a Uint8Array.
 * @guarantee Returns valid bencoded Uint8Array, throws on floats or unsupported types.
 */
export function bencode(data: unknown): Uint8Array {
  if (typeof data === "number") {
    if (Number.isInteger(data)) {
      return new TextEncoder().encode(`i${data}e`);
    }
    throw new Error("Float not supported in bencode");
  }

  if (typeof data === "string") {
    const encoded = new TextEncoder().encode(data);
    return concatenateUint8Arrays([
      new TextEncoder().encode(`${encoded.length}:`),
      encoded,
    ]);
  }

  if (data instanceof Uint8Array) {
    return concatenateUint8Arrays([
      new TextEncoder().encode(`${data.length}:`),
      data,
    ]);
  }

  if (Array.isArray(data)) {
    const parts: Uint8Array[] = [];
    parts.push(new TextEncoder().encode("l"));
    for (const item of data) {
      parts.push(bencode(item));
    }
    parts.push(new TextEncoder().encode("e"));
    return concatenateUint8Arrays(parts);
  }

  if (typeof data === "object" && data !== null) {
    const parts: Uint8Array[] = [];
    parts.push(new TextEncoder().encode("d"));
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      parts.push(bencode(key));
      parts.push(bencode(obj[key]));
    }
    parts.push(new TextEncoder().encode("e"));
    return concatenateUint8Arrays(parts);
  }

  throw new Error(`Unsupported type: ${typeof data}`);
}

/**
 * @intent Decodes Bencode format data from BitTorrent DHT protocol into JavaScript.
 * @param data - The Bencode-encoded Uint8Array to decode.
 * @returns The decoded JavaScript data (string, number, Uint8Array, array, or object).
 * @guarantee Returns parsed JavaScript data or throws on malformed bencode.
 */
export function bdecode(data: Uint8Array): unknown {
  let position = 0;

  function bytesToString(bytes: Uint8Array): string {
    return new TextDecoder("latin1").decode(bytes);
  }

  function peek(): number {
    return data[position];
  }

  function consume(): number {
    return data[position++];
  }

  function parse(): unknown {
    if (position >= data.length) {
      throw new Error("Unexpected end of input");
    }

    const char = peek();

    if (char >= 0x30 && char <= 0x39) {
      return parseString();
    }

    if (char === 0x69) {
      return parseInt_();
    }

    if (char === 0x6c) {
      return parseList();
    }

    if (char === 0x64) {
      return parseDict();
    }

    throw new Error(`Unexpected character: ${String.fromCharCode(char)}`);
  }

  function parseString(): Uint8Array | string {
    let numStart = position;
    while (position < data.length && peek() >= 0x30 && peek() <= 0x39) {
      position++;
    }
    if (position >= data.length || peek() !== 0x3a) {
      throw new Error("Invalid string format");
    }
    const length = parseInt(bytesToString(data.slice(numStart, position)), 10);
    position++;
    const start = position;
    const end = start + length;
    if (end > data.length) {
      throw new Error(
        `String length ${length} exceeds available data (${data.length - start} bytes remaining)`,
      );
    }
    position = end;
    const hasHighBytes = data.slice(start, end).some((b) => b >= 0x80);
    if (hasHighBytes) {
      return data.slice(start, end);
    }
    return bytesToString(data.slice(start, end));
  }

  function parseInt_(): number {
    consume();
    const start = position;
    while (position < data.length && peek() !== 0x65) {
      position++;
    }
    if (position >= data.length) {
      throw new Error("Invalid integer format");
    }
    const result = parseInt(bytesToString(data.slice(start, position)), 10);
    position++;
    return result;
  }

  function parseList(): unknown[] {
    consume();
    const result: unknown[] = [];
    while (position < data.length && peek() !== 0x65) {
      result.push(parse());
    }
    if (position >= data.length) {
      throw new Error("Unterminated list");
    }
    position++;
    return result;
  }

  function parseDict(): Record<string, unknown> {
    consume();
    const result: Record<string, unknown> = {};
    while (position < data.length && peek() !== 0x65) {
      const rawKey = parse();
      const key =
        rawKey instanceof Uint8Array
          ? bytesToString(rawKey)
          : (rawKey as string);
      const value = parse();
      result[key] = value;
    }
    if (position >= data.length) {
      throw new Error("Unterminated dict");
    }
    position++;
    return result;
  }

  const result = parse();
  if (position !== data.length) {
    throw new Error("Extra data after decoding");
  }
  return result;
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export { concatenateUint8Arrays };