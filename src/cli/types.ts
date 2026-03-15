/**
 * Options passed to every command handler controlling output mode.
 *
 * @intent Carry per-invocation output flags so commands can adjust their behaviour.
 * @guarantee `isJson` and `isSilent` are always present; `mode` identifies the runtime environment when provided.
 */
export interface CommandOptions {
  isJson: boolean;
  isSilent: boolean;
  mode?: string;
}

/**
 * Signature shared by all CLI command handler functions.
 *
 * @intent Provide a uniform contract so the command dispatcher can call any handler identically.
 * @guarantee Accepts raw argument string, a hub reference, options, and an optional readline interface; returns a resolved Promise.
 */
export type CommandHandler = (
  argsStr: string,
  hub: CoreHub,
  options: CommandOptions,
  rl?: ReadlineInterface,
) => Promise<void>;

/**
 * Structured result of tokenising a raw CLI argument string.
 *
 * @intent Separate named flags from positional values so commands can inspect them independently.
 * @guarantee `args` contains every `--key[=value]` token; `positional` contains all other tokens.
 */
export interface ParsedArgs {
  args: Record<string, string | boolean>;
  positional: string[];
}

/**
 * Minimal interface to the Core Hub required by CLI command handlers.
 *
 * @intent Decouple CLI commands from the full Hub implementation so they can be tested with a stub.
 * @guarantee Exposes exactly the lifecycle and request-dispatch surface commands depend on.
 */
export interface CoreHub {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  handleRequest: (request: {
    method: string;
    params?: Record<string, unknown>;
  }) => Promise<{ error?: { message: string }; result?: unknown }>;
  getStatus: () => { socketPath: string; storagePath: string };
}

/**
 * Minimal readline interface used by interactive CLI prompts.
 *
 * @intent Allow wizard and confirmation flows to interact with the user without coupling to Node's concrete readline module.
 * @guarantee Provides question, close, pause, resume, and line-event registration methods.
 */
export interface ReadlineInterface {
  question(query: string, callback: (answer: string) => void): void;
  close(): void;
  pause(): void;
  resume(): void;
  on(event: "line", callback: (input: string) => void): void;
}

/**
 * Summary record for a single mounted library directory.
 *
 * @intent Transfer mount metadata between the hub and CLI display layers.
 * @guarantee Contains the mount path, its current status string, and a count of indexed files.
 */
export interface MountEntry {
  path: string;
  status: string;
  fileCount: number;
}

/**
 * Identifier and display name for a supported game system.
 *
 * @intent Represent a retro game system as returned by the curation layer.
 * @guarantee `id` is a stable machine-readable key; `title` is a human-readable label.
 */
export interface SystemInfo {
  id: string;
  title: string;
}

/**
 * A single match returned by a wishlist database search.
 *
 * @intent Surface enough metadata for the user to identify a game from search output.
 * @guarantee Always contains `title` and `region`; `sha1` is present when available in the DAT record.
 */
export interface SearchResult {
  title: string;
  sha1?: string;
  region: string;
}
