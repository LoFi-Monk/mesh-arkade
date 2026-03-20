/**
 * @file harness.ts
 * @description Shared test infrastructure for integration test harness.
 */

import { vi } from "vitest";
import { getOs } from "../core/runtime.js";
import { closeDatabase } from "../core/database.js";
import { CoreHub } from "../core/hub.js";

interface PearAppWithStorage {
  args: string[];
  key: string | null;
  dev: boolean;
  storage?: string;
}

interface TestEnvResult {
  /** Path to the temporary test directory */
  tempDir: string;
  /** Cleanup function to restore previous state */
  cleanup: () => Promise<void>;
}

interface MockPeer {
  /** Fetch a ROM by SHA1, returns null if SHA1 doesn't match */
  fetchVerifiedRom: (sha1: string) => Promise<Uint8Array | null>;
}

let currentTempDir: string | null = null;
let originalStorage: string | undefined = undefined;

/**
 * @intent Sets up a clean test environment with isolated storage and module state.
 * @guarantee Stubs `Pear.app.storage` to a fresh OS temp directory and resets all modules.
 * @constraint The returned cleanup function MUST be called after the test to restore state.
 */
export async function setupTestEnv(): Promise<TestEnvResult> {
  const os = await getOs();
  const tempDir = `${os.tmpdir()}/mesharkade-test-${Date.now()}`;
  currentTempDir = tempDir;

  if (typeof Pear !== "undefined" && Pear.app) {
    const app = Pear.app as PearAppWithStorage;
    originalStorage = app.storage;
    app.storage = tempDir;
  }

  CoreHub.resetInstance();

  return {
    tempDir,
    cleanup: async () => {
      await teardownTestEnv();
    },
  };
}

/**
 * @intent Tears down the test environment by closing the database, resetting singletons, and cleaning up temp directories.
 * @guarantee Safe to call when no setup occurred — handles gracefully as a no-op.
 * @constraint Should only be called after `setupTestEnv()` or as part of the cleanup callback.
 */
export async function teardownTestEnv(): Promise<void> {
  if (typeof Pear !== "undefined" && Pear.app) {
    if (originalStorage !== undefined) {
      const app = Pear.app as PearAppWithStorage;
      app.storage = originalStorage;
      originalStorage = undefined;
    }
  }

  try {
    await closeDatabase();
  } catch {
    // Ignore close errors when not initialized
  }

  CoreHub.resetInstance();
  currentTempDir = null;
}

/**
 * @intent Creates a mock peer that serves known bytes for a specific SHA1 hash.
 * @guarantee Returns a mock fetch layer that serves the provided data when SHA1 matches, null otherwise.
 * @constraint The returned mock does NOT perform actual network operations.
 */
export function createMockPeer(sha1: string, data: Uint8Array): MockPeer {
  const normalizedSha1 = sha1.toLowerCase();

  return {
    fetchVerifiedRom: async (
      requestedSha1: string,
    ): Promise<Uint8Array | null> => {
      const normalizedRequested = requestedSha1.toLowerCase();
      if (normalizedRequested === normalizedSha1) {
        return data;
      }
      return null;
    },
  };
}

export type { TestEnvResult, MockPeer };
