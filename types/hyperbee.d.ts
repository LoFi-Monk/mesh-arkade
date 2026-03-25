declare module 'hyperbee' {
  class Hyperbee {
    constructor(core: unknown, opts?: HyperbeeOptions)

    readonly core: unknown
    readonly feed: unknown
    readonly key: Buffer
    readonly discoveryKey: Buffer
    readonly id: Buffer
    readonly version: number
    readonly writable: boolean
    readonly readable: boolean

    ready(): Promise<void>
    close(): Promise<void>

    put(key: string, value: unknown): Promise<unknown>
    get(key: string, opts?: HyperbeeGetOptions): Promise<HyperbeeEntry | null>
    del(key: string, opts?: unknown): Promise<unknown>

    sub(prefix: string, opts?: HyperbeeSubOptions): Hyperbee

    createReadStream(range?: HyperbeeRange, opts?: HyperbeeReadStreamOptions): HyperbeeReadStream & AsyncIterable<HyperbeeEntry>

    replicate(isInitiator: boolean, opts?: unknown): unknown
    update(opts?: unknown): unknown
    checkout(version: number, opts?: unknown): Hyperbee
    snapshot(opts?: unknown): Hyperbee
  }

  interface HyperbeeOptions {
    keyEncoding?: string
    valueEncoding?: string
    readonly?: boolean
    prefix?: Buffer | null
    sep?: Buffer | null
    lock?: unknown
    extension?: boolean | null
    metadata?: unknown
    sessions?: boolean
    checkout?: number
    _view?: boolean
    _sub?: boolean
  }

  interface HyperbeeGetOptions {
    finalise?: boolean
  }

  interface HyperbeeSubOptions {
    sep?: Buffer | string
    keyEncoding?: string
    valueEncoding?: string
  }

  interface HyperbeeRange {
    gte?: string
    lte?: string
    gt?: string
    lt?: string
    limit?: number
  }

  interface HyperbeeReadStreamOptions {
    signal?: AbortSignal
    live?: boolean
    tail?: boolean
  }

  interface HyperbeeEntry {
    key: string
    value: unknown
  }

  class HyperbeeReadStream {
    [Symbol.asyncIterator](): AsyncIterator<HyperbeeEntry>
    destroy(): void
  }

  export = Hyperbee
}
