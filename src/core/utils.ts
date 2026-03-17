/**
 * @file utils.ts
 * @description General utility functions for MeshARKade.
 */

/**
 * @intent Clamps a numeric value within a specified range [min, max].
 * @guarantee Returns min if value < min, max if value > max, otherwise returns value unchanged.
 * @constraint The min parameter must be less than or equal to max. Behavior is undefined if min > max.
 */
function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export { clamp };
