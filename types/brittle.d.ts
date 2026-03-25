declare module 'brittle' {
  interface TestInstance {
    plan (n: number): void
    pass (message?: string): void
    fail (message?: string): void
    ok (value: unknown, message?: string): void
    absent (value: unknown, message?: string): void
    is (actual: unknown, expected: unknown, message?: string): void
    not (actual: unknown, expected: unknown, message?: string): void
    alike (actual: unknown, expected: unknown, message?: string): void
    unlike (actual: unknown, expected: unknown, message?: string): void
    exception (fn: () => unknown, message?: string): Promise<void>
    execution (fn: () => unknown, message?: string): Promise<void>
    comment (message: string): void
    end (): void
    teardown (fn: () => void | Promise<void>): void
    test (name: string, fn: (t: TestInstance) => void | Promise<void>): TestInstance
    timeout (ms: number): void
    tmp (): string
    tmp (opts?: { dir?: string; name?: string }): string
  }

  function test (name: string, fn: (t: TestInstance) => void | Promise<void>): TestInstance
  export default test
}
