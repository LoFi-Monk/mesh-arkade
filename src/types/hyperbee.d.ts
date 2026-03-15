declare module "hyperbee" {
  class Hyperbee<T = unknown> {
    constructor(
      core: unknown,
      options?: {
        keyEncoding?: string;
        valueEncoding?: string;
      },
    );
    ready(): Promise<void>;
    sub(name: string, options?: unknown): Hyperbee;
    get(key: string): Promise<{ key: string; value: T } | null>;
    put(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    batch(): HyperbeeBatch<T>;
    createReadStream(): AsyncIterable<{ key: string; value: T }>;
    close(): Promise<void>;
  }

  interface HyperbeeBatch<T = unknown> {
    put(key: string, value: T): Promise<void>;
    del(key: string): Promise<void>;
    flush(): Promise<void>;
  }

  export default Hyperbee;
}

declare module "corestore" {
  class Corestore {
    constructor(storage: string | unknown);
    get(name: string): unknown;
    close(): Promise<void>;
  }

  export default Corestore;
}

declare module "random-access-memory" {
  function RandomAccessMemory(size?: number): unknown;
  export default RandomAccessMemory;
}

declare module "bare-fs" {
  const fs: {
    existsSync(path: string): boolean;
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    readFileSync(path: string, encoding?: string): string | Buffer;
    writeFileSync(path: string, data: string | Buffer): void;
    readdirSync(path: string): string[];
    statSync(path: string): { size: number; isDirectory(): boolean };
    unlinkSync(path: string): void;
    rmdirSync(path: string): void;
  };
  export default fs;
}

declare module "bare-path" {
  const path: {
    join(...parts: string[]): string;
    dirname(path: string): string;
    basename(path: string): string;
    extname(path: string): string;
    resolve(...parts: string[]): string;
  };
  export default path;
}

declare module "bare-os" {
  const os: {
    homedir(): string;
    tmpdir(): string;
    platform(): string;
    arch(): string;
    cpus(): { model: string; speed: number }[];
    totalmem(): number;
    freemem(): number;
  };
  export default os;
}

declare module "bare-fetch" {
  const fetch: typeof globalThis.fetch;
  export default fetch;
}

declare module "hyperswarm" {
  class Hyperswarm {
    constructor(options?: {
      keyPair?: unknown;
      seed?: Buffer;
      maxPeers?: number;
    });
    join(
      topic: Buffer,
      options?: { client?: boolean; server?: boolean; limit?: number },
    ): HyperswarmDiscovery;
    readonly connections: Set<HyperswarmConnection>;
    readonly peers: Map<string, unknown>;
    on(
      event: "connection",
      callback: (conn: HyperswarmConnection, info: PeerInfo) => void,
    ): void;
    on(event: "update", callback: () => void): void;
    destroy(): Promise<void>;
  }

  interface PeerInfo {
    readonly publicKey: Buffer;
    readonly topics: Buffer[];
  }

  interface HyperswarmDiscovery {
    flushed(): Promise<void>;
  }

  interface HyperswarmConnection {
    on(event: "data", callback: (data: Buffer) => void): void;
    on(event: "end", callback: () => void): void;
    on(event: "error", callback: (err: Error) => void): void;
    write(data: Buffer): void;
    end(): void;
  }

  export default Hyperswarm;
}

declare module "bittorrent-dht" {
  class DHT {
    constructor(options?: {
      nodeId?: string | Buffer;
      bootstrap?: string[];
      host?: string | false;
      concurrency?: number;
    });
    on(
      event: "peer",
      callback: (
        peer: { host: string; port: number },
        infoHash: string,
        from: { address: string; port: number },
      ) => void,
    ): void;
    lookup(infoHash: string): void;
    destroy(): Promise<void>;
  }

  export default DHT;
}

declare const Bare: {
  app: {
    args: string[];
    key: string | null;
    dev: boolean;
    storage?: string;
  };
  teardown: (fn: () => Promise<void> | void) => void;
};

declare module "bare-crypto" {
  function createHash(algorithm: string): {
    update(data: Buffer | Uint8Array | string): {
      digest(encoding: string): string;
    };
    digest(encoding: string): string;
  };
  export { createHash };
  export default { createHash };
}
