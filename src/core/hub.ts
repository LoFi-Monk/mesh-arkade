/**
 * @file hub.ts
 * @description Core Hub - singleton engine managing P2P swarm, storage, and local bridge sockets.
 */

interface PearAppWithStorage {
  args: string[];
  key: string | null;
  dev: boolean;
  storage?: string;
}

/**
 * Core Hub status information.
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
 */
export interface HubResponse {
  /** The result of the command (if successful) */
  result?: unknown;
  /** Error information (if failed) */
  error?: { code: number; message: string };
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

    this._running = false;
    this._socketPath = null;
  }

  /**
   * Determines the storage location based on runtime environment.
   *
   * @intent Provide appropriate storage path for different runtime contexts.
   * @guarantee Returns a valid path string.
   */
  private getStorageLocation(): string {
    const pearApp =
      typeof Pear !== "undefined" ? (Pear.app as PearAppWithStorage) : null;
    if (pearApp?.storage) {
      return pearApp.storage;
    }
    return "./data";
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
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      return { result, id };
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

export const hub = CoreHub.getInstance();
export default hub;
