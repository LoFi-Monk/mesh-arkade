/**
 * @intent Provide a mock implementation of bare-type for test environments.
 * @guarantee Returns the JavaScript typeof equivalent for all input values, matching bare-type's runtime behavior.
 * @constraint Uses a no-op implementation — bare-type's native addon loading is bypassed in tests.
 * @see https://github.com/holepunchto/bare-type
 */
export function type(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

export default { type };
