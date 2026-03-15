/**
 * @file errors.ts
 * @description Error types for the P2P fetch system.
 */

/**
 * @intent Represents a timeout error when a fetch layer fails to respond within the allowed time.
 * @guarantee Includes the layer name and timeout duration for debugging.
 */
export class FetchLayerTimeoutError extends Error {
  public readonly layer: string;
  public readonly timeoutMs: number;

  constructor(layer: string, timeoutMs: number) {
    super(`Fetch layer '${layer}' timed out after ${timeoutMs}ms`);
    this.name = "FetchLayerTimeoutError";
    this.layer = layer;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * @intent Represents a generic error from a fetch layer.
 * @guarantee Includes the layer name and the underlying error.
 */
export class FetchLayerError extends Error {
  public readonly layer: string;

  constructor(layer: string, message: string, cause?: unknown) {
    super(`Fetch layer '${layer}' failed: ${message}`, cause ? { cause } : undefined);
    this.name = "FetchLayerError";
    this.layer = layer;
  }
}

/**
 * @intent Represents a failure when all fetch layers have failed to retrieve the content.
 * @guarantee Contains an array of errors from each layer for detailed failure analysis.
 */
export class AllLayersFailedError extends Error {
  public readonly errors: Array<{ layer: string; error: string }>;

  constructor(errors: Array<{ layer: string; error: string }>) {
    const errorSummary = errors.map((e) => `${e.layer}: ${e.error}`).join("; ");
    super(`All fetch layers failed: ${errorSummary}`);
    this.name = "AllLayersFailedError";
    this.errors = errors;
  }
}
