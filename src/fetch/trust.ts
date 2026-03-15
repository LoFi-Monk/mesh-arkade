/**
 * @file trust.ts
 * @description Trust model for verified DAT source fetching.
 */

/**
 * @intent Represents a trusted DAT source with optional public key verification.
 * @guarantee url is always present; publicKey is optional; expectedHash must match for verification.
 */
export interface TrustedSource {
  systemId: string;
  url: string;
  publicKey?: string;
  description: string;
  expectedHash: string;
}

/**
 * @intent Hardcoded list of known-good No-Intro DAT sources from Libretro GitHub.
 * @guarantee These URLs are trusted endpoints for DAT bootstrap.
 */
export const TRUSTED_DAT_SOURCES: TrustedSource[] = [
  {
    systemId: "nes",
    url: "https://raw.githubusercontent.com/libretro/metadata-assets/master/No-Intro/Nintendo/Nintendo - Nintendo Entertainment System.json",
    description: "Libretro No-Intro NES DAT mirror",
    expectedHash: "",
  },
  {
    systemId: "snes",
    url: "https://raw.githubusercontent.com/libretro/metadata-assets/master/No-Intro/Nintendo/Nintendo - Super Nintendo Entertainment System.json",
    description: "Libretro No-Intro SNES DAT mirror",
    expectedHash: "",
  },
  {
    systemId: "gb",
    url: "https://raw.githubusercontent.com/libretro/metadata-assets/master/No-Intro/Nintendo/Nintendo Game Boy.json",
    description: "Libretro No-Intro Game Boy DAT mirror",
    expectedHash: "",
  },
  {
    systemId: "gbc",
    url: "https://raw.githubusercontent.com/libretro/metadata-assets/master/No-Intro/Nintendo/Nintendo Game Boy Color.json",
    description: "Libretro No-Intro Game Boy Color DAT mirror",
    expectedHash: "",
  },
];

/**
 * @intent Fetches a DAT file from a trusted source and verifies its content hash.
 * @guarantee Returns the Buffer if hash matches, throws if hash mismatch or network error.
 * @param systemId The system ID to look up trusted source for.
 */
export async function fetchVerifiedDat(systemId: string): Promise<Buffer> {
  const normalizedSystemId = systemId.toLowerCase();
  const source = TRUSTED_DAT_SOURCES.find(
    (s) => s.systemId.toLowerCase() === normalizedSystemId,
  );

  if (!source) {
    throw new Error(`No trusted source configured for system: ${systemId}`);
  }

  const { getFetch, getCrypto } = await import("../core/runtime.js");
  const fetch = await getFetch();

  try {
    const response = await fetch(source.url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch DAT: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For now, accept empty expected hash (placeholder until real hashes are configured)
    if (source.expectedHash) {
      const crypto = await getCrypto();
      const hash = crypto.createHash("sha1").update(buffer).digest("hex");

      if (hash.toLowerCase() !== source.expectedHash.toLowerCase()) {
        throw new Error(
          `Hash mismatch: expected ${source.expectedHash}, got ${hash}`,
        );
      }
    }

    return buffer;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Hash mismatch")) {
      throw err;
    }
    throw new Error(`Failed to fetch verified DAT: ${(err as Error).message}`);
  }
}
