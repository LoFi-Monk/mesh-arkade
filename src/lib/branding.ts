export const appName = "MeshARKade";

export const taglines = [
  "Play it Forward",
  "Seed the Archive",
  "The Games Remain",
];

export const categories = {
  archival: ["Vault", "Repository", "Depot", "Cache", "Catalog"],
  museum: ["Conservatory", "Gallery", "Collection", "Anthology"],
  organic: ["Preserve", "Sanctuary", "Reserve", "Habitat"],
  technical: ["Mirror"],
  scene: ["Library"],
} as const;

const allWords = Object.values(categories).flat();
const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
export const descriptor = `A Decent Game ${randomWord}`;

export const branding = {
  colors: {
    retro: {
      primary: "#ff00ff", // Neon Pink/Magenta
      secondary: "#00ffff", // Cyan
      background: "#0d0d21", // Dark Navy
      surface: "#1a1a3a", // Slightly lighter navy
      text: "#ffffff",
      accent: "#ffff00", // Yellow
      border: "#ffffff",
    },
    // Keep baseline colors for compatibility
    primary: "Black",
    secondary: "Gray",
    accent: "White",
  },
  fonts: {
    retro: '"Press Start 2P", system-ui, sans-serif',
  },
};

// Also export individual constants for Welcome.tsx compatibility
export const colors = branding.colors;

export type Branding = typeof branding;
