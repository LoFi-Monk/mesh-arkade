/**
 * Mock for bare-type native module.
 *
 * bare-type uses `require.addon` which is a Bare runtime API not available in
 * Node.js/Vitest test environments. This stub provides a no-op implementation
 * that allows tests to run without native addon loading errors.
 *
 * @see https://github.com/holepunchto/bare-type
 */
export function type(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

export default { type };
