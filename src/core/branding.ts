/**
 * @file branding.ts
 * @description Core branding module - provides identity, taglines, and visual theming.
 */

/**
 * The official application name.
 *
 * @intent Provide a single source of truth for the app's display name.
 * @guarantee This value is never empty and matches exactly "MeshARKade".
 */
export const appName = "Mesh ARKade";

/**
 * Predefined rotating taglines for terminal splash.
 *
 * @intent Reflect the game's preservation mission in the splash screen.
 * @guarantee Each tagline is a non-empty string suitable for terminal display.
 */
export const taglines = [
  "A Decentralized Museum of Retro Games.",
  "A Decentralized Archive of Shared History.",
  "A Decentralized Library of Digital Spirits.",
] as const;

/**
 * Type representing valid tagline values.
 *
 * @intent Provide type safety for rotating taglines.
 * @guarantee Matches one of the strings in the taglines array.
 */
export type Tagline = (typeof taglines)[number];

/**
 * Returns a tagline, randomly selected or deterministically via seed.
 *
 * @param seed - Optional seed for deterministic selection.
 * @intent Provide a dynamic splash screen tagline.
 * @guarantee Returns a non-empty string from the predefined taglines.
 */
export const getTagline = (seed?: number): string => {
  const index =
    seed !== undefined
      ? seed % taglines.length
      : Math.floor(Math.random() * taglines.length);
  return taglines[index];
};

/**
 * Categories of words used to generate descriptor phrases.
 *
 * @intent Define the semantic groups for descriptor generation.
 * @guarantee Contains archival, museum, organic, technical, and scene keys.
 */
export const categories = {
  archival: ["Vault", "Repository", "Depot", "Cache", "Catalog"],
  museum: ["Conservatory", "Gallery", "Collection", "Anthology"],
  organic: ["Preserve", "Sanctuary", "Reserve", "Habitat"],
  technical: ["Mirror"],
  scene: ["Library"],
} as const;

/**
 * Keys for the branding categories.
 *
 * @intent Provide type safety for category selection.
 * @guarantee strictly limited to the keys of the categories constant.
 */
export type CategoryKey = keyof typeof categories;

const allWords = Object.values(categories).flat();

/**
 * Generates a descriptor phrase using a random word from all categories.
 *
 * @param seed - Optional seed for deterministic generation.
 * @intent Create a unique, descriptive identity string for the app instance.
 * @guarantee Returns "A Decent Game {word}" where word is from categories.
 *            When seed is provided, returns the same descriptor for the same seed.
 */
export const getDescriptor = (seed?: number): string => {
  const index =
    seed !== undefined
      ? seed % allWords.length
      : Math.floor(Math.random() * allWords.length);
  return `A Decent Game ${allWords[index]}`;
};

/**
 * Complete branding configuration with colors and fonts.
 *
 * @intent Centralized visual styling source for all interfaces.
 * @guarantee strictly defined with hex colors and valid CSS font stacks.
 */
export const branding = {
  colors: {
    retro: {
      primary: "#ff00ff",
      secondary: "#00ffff",
      background: "#0d0d21",
      surface: "#1a1a3a",
      text: "#ffffff",
      accent: "#ffff00",
      border: "#ffffff",
    },
    primary: "Black",
    secondary: "Gray",
    accent: "White",
  },
  fonts: {
    retro: '"Press Start 2P", system-ui, sans-serif',
  },
};

/**
 * Exported colors for direct usage in styled components.
 *
 * @intent provide quick access to the branding color palette.
 * @guarantee matches the values defined in the central branding object.
 */
export const colors = branding.colors;
/**
 * Type representing the full branding object.
 *
 * @intent provide type safety for theming providers and consumers.
 * @guarantee strictly matches the branding object structure.
 */
export type Branding = typeof branding;

/**
 * Default instance for component compatibility.
 *
 * @intent Provide a static descriptor for legacy or stateless components.
 * @guarantee Generated once on module load using getDescriptor().
 */
export const descriptor = getDescriptor();
/**
 * Default instance for component compatibility.
 *
 * @intent Provide a static tagline for legacy or stateless components.
 * @guarantee Generated once on module load using getTagline().
 */
export const tagline = getTagline();
