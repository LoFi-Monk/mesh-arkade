declare module 'hyperdrive' {
  interface HyperdriveOptions {
    sparse?: boolean
    onWait?: () => void
    blobs?: unknown
  }

  class Hyperdrive {
    constructor(corestore: unknown, key: unknown, options?: HyperdriveOptions)
    ready(): Promise<void>
    readdir(path: string): unknown
    createReadStream(path: string): unknown
    close(): Promise<void>
    key: Buffer
    discoveryKey: Buffer
    mirror(storage: unknown): unknown
    has(path: string): Promise<boolean>
    entry(path: string): Promise<unknown>
    batch(ops: unknown[]): Promise<void>
  }

  export default Hyperdrive
}

declare module 'localdrive' {
  interface LocaldriveOptions {
    prefix?: string
  }

  class Localdrive {
    constructor(rootPath: string, options?: LocaldriveOptions)
    ready(): Promise<void>
    close(): Promise<void>
    put(path: string, value: Buffer | string): Promise<void>
    list(path: string): unknown
  }

  export default Localdrive
}