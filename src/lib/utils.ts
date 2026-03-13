import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes and handles conditional class logic safely.
 *
 * @intent Provide a consistent utility for dynamic Tailwind class merging.
 * @guarantee Returns a processed string of CSS classes with resolved conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
