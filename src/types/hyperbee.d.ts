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

declare const Bare: {
  app: {
    args: string[];
    key: string | null;
    dev: boolean;
    storage?: string;
  };
  teardown: (fn: () => Promise<void> | void) => void;
};
