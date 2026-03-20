/**
 * @file hub.ts
 * @description Core Hub - singleton engine managing P2P swarm, storage, and local bridge sockets.
 */

import type { Mount } from "./curator.js";
import type { SeedResult, SearchResult } from "./curation.js";
import { getStorageBasePath } from "./paths.js";

/**
 * Core Hub status information.
 *
 * @intent Provide a structured status report for the hub's runtime state.
 * @guarantee Contains current running state and resolved path information.
 */
export interface HubStatus {
  /** Whether the hub is currently running */
  running: boolean;
  /** The socket path for local IPC communication */
  socketPath: string | null;
  /** Storage directory path */
  storagePath: string | null;
}

/**
 * JSON-RPC request format for hub commands.
 *
 * @intent Define the communication contract for all hub interface clients.
 * @guarantee Strictly follows JSON-RPC 2.0 structure for method calls.
 */
export interface HubRequest {
  /** The command to execute */
  method: string;
  /** Optional parameters for the command */
  params?: Record<string, unknown>;
  /** Request ID for tracking */
  id?: string | number;
}

/**
 * JSON-RPC response format from hub.
 *
 * @intent Define the result/error wrapper for hub command responses.
 * @guarantee Always includes either a result or an error object with a matching ID.
 */
export interface HubResponse {
  /** The result of the command (if successful) */
  result?: unknown;
  /** Error information (if failed), null if successful */
  error?: { code: number; message: string } | null;
  /** Matching request ID */
  id?: string | number;
}

/**
 * Core Hub class - manages the P2P swarm, storage, and local bridge.
 *
 * @intent Provide a centralized hub that manages all core functionality.
 *        Any interface (CLI or GUI) acts as a client to this Hub via IPC.
 * @guarantee This is a singleton - only one instance can exist at a time.
 */
class CoreHub {
  private static instance: CoreHub | null = null;
  private _running: boolean = false;
  private _socketPath: string | null = null;
  private _storagePath: string | null = null;

  /**
   * Resets the singleton instance.
   * @internal
   */
  static resetInstance(): void {
    CoreHub.instance = null;
  }

  /**
   * Gets the singleton instance of CoreHub.
   *
   * @intent Ensure only one hub instance exists.
   * @guarantee Returns the same instance on every call.
   */
  static getInstance(): CoreHub {
    if (!CoreHub.instance) {
      CoreHub.instance = new CoreHub();
    }
    return CoreHub.instance;
  }

  /**
   * Gets the current hub status.
   *
   * @intent Provide status information for monitoring/scripting.
   * @guarantee Returns a HubStatus object with current state.
   */
  getStatus(): HubStatus {
    return {
      running: this._running,
      socketPath: this._socketPath,
      storagePath: this._storagePath,
    };
  }

  /**
   * Gets the socket path for local IPC.
   */
  getSocketPath(): string | null {
    return this._socketPath;
  }

  /**
   * Gets the storage path.
   */
  getStoragePath(): string | null {
    return this._storagePath;
  }

  /**
   * Initializes the Core Hub with storage and socket configuration.
   *
   * @intent Set up the hub with necessary paths and initialize components.
   * @guarantee Once started, the hub is in running state with valid socket path.
   */
  async start(): Promise<void> {
    if (this._running) {
      return;
    }

    this._storagePath = this.getStorageLocation();
    this._socketPath = this.getSocketPathForStorage(this._storagePath);

    this._running = true;
  }

  /**
   * Stops the Core Hub and cleans up resources.
   *
   * @intent Gracefully shut down the hub.
   * @guarantee After stopping, the hub is not running and resources are released.
   */
  async stop(): Promise<void> {
    if (!this._running) {
      return;
    }

    const { closeDatabase } = await import("./database.js");
    try {
      await closeDatabase();
    } finally {
      this._running = false;
      this._socketPath = null;
    }
  }

  /**
   * Determines the storage location based on runtime environment.
   *
   * @intent Provide appropriate storage path for different runtime contexts.
   * @guarantee Returns a valid path string.
   */
  private getStorageLocation(): string {
    return getStorageBasePath();
  }

  /**
   * Generates socket path relative to storage location.
   *
   * @intent Create a consistent socket naming scheme based on storage.
   * @guarantee Returns a unique socket path within the storage directory.
   */
  private getSocketPathForStorage(storagePath: string): string {
    const separator = storagePath.includes(":") ? "\\" : "/";
    return `${storagePath}${separator}mesharkade.sock`;
  }

  private async handleCuratorMount(
    params: Record<string, unknown> | undefined,
  ): Promise<Mount> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params for curator:mount");
    }
    const { path } = params;
    if (typeof path !== "string") {
      throw new Error("Missing required parameter: path");
    }
    const { createCurator } = await import("./curator.js");
    return createCurator().mount(path);
  }

  private async handleCuratorUnmount(
    params: Record<string, unknown> | undefined,
  ): Promise<{ success: boolean }> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params for curator:unmount");
    }
    const { path } = params;
    if (typeof path !== "string") {
      throw new Error("Missing required parameter: path");
    }
    const { createCurator } = await import("./curator.js");
    await createCurator().unmount(path);
    return { success: true };
  }

  private async handleCuratorList(
    _params: Record<string, unknown> | undefined,
  ): Promise<Mount[]> {
    const { createCurator } = await import("./curator.js");
    return createCurator().listMounts();
  }

  private async handleCurationSeed(
    params: Record<string, unknown> | undefined,
  ): Promise<SeedResult> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params for curation:seed");
    }
    const { system } = params;
    if (typeof system !== "string") {
      throw new Error("Missing required parameter: system");
    }
    const { createCurationManager } = await import("./curation.js");
    return createCurationManager().seedSystem(system);
  }

  private async handleCurationSearch(
    params: Record<string, unknown> | undefined,
  ): Promise<SearchResult[]> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params for curation:search");
    }
    const { query, system, limit } = params;
    if (typeof query !== "string") {
      throw new Error("Missing required parameter: query");
    }
    const { createCurationManager } = await import("./curation.js");
    return createCurationManager().searchWishlist(
      query,
      typeof system === "string" ? system : undefined,
      typeof limit === "number" ? limit : 50,
    );
  }

  private async handleCurationSystems(
    _params: Record<string, unknown> | undefined,
  ): Promise<{ id: string; title: string; datUrl: string }[]> {
    const { createCurationManager } = await import("./curation.js");
    return createCurationManager().getSupportedSystems();
  }

  /**
   * @intent Look up a wishlist record by its SHA1 hash.
   * @guarantee Returns the matching WishlistRecord or null if not found.
   * @param params Must contain a `sha1` string (40 hex chars).
   */
  private async handleCurationLookupSha1(
    params: Record<string, unknown> | undefined,
  ): Promise<import("./database.js").WishlistRecord | null> {
    if (!params || typeof params.sha1 !== "string") {
      throw new Error("Missing required parameter: sha1");
    }
    const { getWishlistBySha1 } = await import("./database.js");
    return (await getWishlistBySha1(params.sha1)) ?? null;
  }

  private async handleFetchRom(
    params: Record<string, unknown> | undefined,
  ): Promise<{ filename: string }> {
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params for fetch:rom");
    }
    const { sha1, destDir } = params;
    if (typeof sha1 !== "string") {
      throw new Error("Missing required parameter: sha1");
    }
    if (typeof destDir !== "string") {
      throw new Error("Missing required parameter: destDir");
    }

    const { getFs } = await import("./runtime.js");
    const fs = await getFs();
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const { FetchManager } = await import("../fetch/fetch-manager.js");
    const { getWishlistBySha1 } = await import("./database.js");

    const fetchManager = new FetchManager();
    const records = await getWishlistBySha1(sha1);
    const recordList = records ? [records] : undefined;
    const filename = await fetchManager.fetchAndStage(
      sha1,
      destDir,
      recordList,
    );

    return { filename };
  }

  /**
   * Processes an incoming JSON-RPC request.
   *
   * @intent Handle commands sent via the local socket bridge.
   * @guarantee Returns a valid HubResponse.
   */
  async handleRequest(request: HubRequest): Promise<HubResponse> {
    const { method, params, id } = request;

    try {
      let result: unknown;

      switch (method) {
        case "status":
          result = this.getStatus();
          break;
        case "ping":
          result = { pong: true };
          break;
        case "curator:mount":
          result = await this.handleCuratorMount(params);
          break;
        case "curator:unmount":
          result = await this.handleCuratorUnmount(params);
          break;
        case "curator:list":
          result = await this.handleCuratorList(params);
          break;
        case "curation:seed":
          result = await this.handleCurationSeed(params);
          break;
        case "curation:search":
          result = await this.handleCurationSearch(params);
          break;
        case "curation:systems":
          result = await this.handleCurationSystems(params);
          break;
        case "curation:lookup-sha1":
          result = await this.handleCurationLookupSha1(params);
          break;
        case "database:reset": {
          const { resetDatabase } = await import("./database.js");
          await resetDatabase();
          result = { success: true };
          break;
        }
        case "fetch:rom":
          result = await this.handleFetchRom(params);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      return { result, error: null, id };
    } catch (error) {
      return {
        error: {
          code: -32601,
          message: error instanceof Error ? error.message : "Unknown error",
        },
        id,
      };
    }
  }
}

/**
 * Static instance of the hub shared across the application.
 *
 * @intent Provide the main singleton entry point for hub operations.
 * @guarantee This object is always an initialized CoreHub instance.
 */
export function getEngineHub() {
  return CoreHub.getInstance();
}
export { CoreHub };
export default getEngineHub;
