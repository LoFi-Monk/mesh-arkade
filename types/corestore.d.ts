declare module 'corestore' {
  class Corestore {
    constructor(storage: string | unknown, opts?: CorestoreOptions)

    readonly root: Corestore | null
    readonly opened: boolean
    readonly closed: boolean

    ready(): Promise<void>
    close(): Promise<void>

    get(opts?: CorestoreGetOptions): unknown
    session(opts?: CorestoreSessionOptions): Corestore

    namespace(name: string, opts?: CorestoreNamespaceOptions): Corestore

    replicate(isInitiator: boolean, opts?: unknown): unknown

    watch(fn: (core: unknown) => void): void
    unwatch(fn: (core: unknown) => void): void

    findingPeers(): () => void

    audit(opts?: unknown): unknown
  }

  interface CorestoreOptions {
    id?: Buffer | null
    primaryKey?: Buffer | null
    unsafe?: boolean
    allowBackup?: boolean
    readOnly?: boolean
    writable?: boolean
    wait?: boolean
    namespace?: Buffer
    manifestVersion?: number
    suspend?: boolean
    active?: boolean
    globalCache?: unknown
    root?: Corestore | null
  }

  interface CorestoreGetOptions {
    name?: string
    key?: Buffer | string
    keyPair?: unknown
    manifest?: unknown
    preload?: unknown | (() => Promise<unknown>)
    discoveryKey?: Buffer
    valueEncoding?: string
    encryption?: unknown
    encryptionKey?: unknown
    exclusive?: boolean
    onwait?: () => void
    pushOnly?: boolean
    wait?: boolean
    timeout?: number
    writable?: boolean
    active?: boolean
    draft?: boolean
    createIfMissing?: boolean
    overwrite?: boolean
  }

  interface CorestoreSessionOptions {
    primaryKey?: Buffer | null
    unsafe?: boolean
    allowBackup?: boolean
    readOnly?: boolean
    writable?: boolean
    wait?: boolean
    namespace?: Buffer
    manifestVersion?: number
    suspend?: boolean
    active?: boolean
    globalCache?: unknown
  }

  interface CorestoreNamespaceOptions {
    primaryKey?: Buffer | null
    unsafe?: boolean
    allowBackup?: boolean
    readOnly?: boolean
    writable?: boolean
    wait?: boolean
    manifestVersion?: number
    suspend?: boolean
    active?: boolean
    globalCache?: unknown
  }

  export = Corestore
}
