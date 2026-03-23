declare global {
  namespace Pear {
    interface Config {
      key: Buffer | null
      alias: string | null
      checkpoint: string | null
      links: string[]
      dev: boolean
      storage: string
      name: string
      main: string
      args: string[]
      channel: string
      applink: string
      fragment: string | null
      link: string
      entrypoint: string
      dir: string
      pearDir: string
      options: Record<string, unknown>
      flags: Record<string, unknown>
    }

    function versions (): Promise<{ app: string; platform: string }>
    function exit (code?: number): void
    function restart (options?: { platform?: boolean }): Promise<void>
    function reload (options?: { platform?: boolean }): Promise<void>
    function teardown (fn: () => void): Promise<void>

    const config: Config
  }

  const Pear: typeof import('./pear').Pear
}

export {}
