/**
 * @file udp-transceiver.ts
 * @description UDP transceiver for BitTorrent DHT protocol communication.
 */

import { FetchLayerTimeoutError } from "../../errors.js";
import { bdecode } from "./bencode.js";
import { DHTMessage, buf2hex, transactionIdToHex } from "./dht-utils.js";

/**
 * @intent Resolves the UDP dgram module based on the current runtime.
 * @guarantee Returns bare-dgram in Bare environment, or Node's dgram module otherwise.
 */
export async function getDgram(): Promise<unknown> {
  if (typeof Bare !== "undefined") {
    return (await import("bare-dgram")).default;
  }
  return await import("dgram");
}

/**
 * @intent Typed socket interface for DHT UDP operations.
 * @guarantee Provides type-safe event handlers for socket events.
 */
export interface UDPSocketLike {
  bind(port: number, callback?: () => void): void;
  send(
    buffer: Uint8Array,
    port: number,
    address: string,
    callback?: (err: Error | null) => void,
  ): void;
  on(event: "error", callback: (err: Error) => void): void;
  on(
    event: "message",
    callback: (
      msg: Uint8Array,
      rinfo: { address: string; port: number },
    ) => void,
  ): void;
  on(event: "listening", callback: () => void): void;
  address(): { address: string; port: number };
  close(): void;
}

/**
 * @intent UDP transceiver for DHT protocol communication.
 * @guarantee Provides asynchronous send/receive with transaction tracking and timeout handling.
 * @constraint Must call bind() before send(). Must call close() to avoid resource leaks.
 *             Post-bind socket errors are silently ignored.
 */
export class UDPTransceiver {
  private socket: unknown = null;
  private address: string = "";
  private port: number = 0;
  private pendingRequests: Map<
    string,
    {
      resolve: (data: Uint8Array) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private messageCallbacks: ((
    msg: DHTMessage,
    rinfo: { address: string; port: number },
  ) => void)[] = [];
  private errorCallback: ((err: Error) => void) | null = null;
  private bound = false;

  public setErrorCallback(callback: (err: Error) => void): void {
    this.errorCallback = callback;
  }

  private getSocket(): UDPSocketLike {
    return this.socket as UDPSocketLike;
  }

  async bind(port: number = 0): Promise<{ address: string; port: number }> {
    const dgram = (await getDgram()) as { createSocket(type: "udp4"): unknown };
    const socket = dgram.createSocket("udp4") as UDPSocketLike;
    this.socket = socket;

    return new Promise((resolve, reject) => {
      const handleError = (err: Error) => {
        if (!this.bound) {
          reject(err);
        } else {
          this.errorCallback?.(err);
        }
      };

      socket.on("error", handleError);

      socket.bind(port, () => {
        this.bound = true;
        const addr = socket.address();
        this.address = addr.address;
        this.port = addr.port;
        resolve({ address: this.address, port: this.port });
      });

      socket.on(
        "message",
        (
          msg: Buffer | Uint8Array,
          rinfo: { address: string; port: number },
        ) => {
          const data = msg instanceof Uint8Array ? msg : new Uint8Array(msg);
          this.handleMessage(data, rinfo);
        },
      );
    });
  }

  private handleMessage(
    data: Uint8Array,
    rinfo: { address: string; port: number },
  ): void {
    let parsed: unknown;
    try {
      parsed = bdecode(data);
    } catch {
      return;
    }

    if (typeof parsed !== "object" || parsed === null) {
      return;
    }

    const msg = parsed as DHTMessage;
    if (!msg.t) {
      return;
    }
    const t = transactionIdToHex(msg.t);

    const pending = this.pendingRequests.get(t);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(t);
      pending.resolve(data);
    }

    for (const cb of this.messageCallbacks) {
      cb(msg, rinfo);
    }
  }

  async send(data: Uint8Array, address: string, port: number): Promise<void> {
    const sock = this.getSocket();
    if (!sock) return;
    return new Promise((resolve, reject) => {
      sock.send(data, port, address, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async sendWithTransaction(
    data: Uint8Array,
    address: string,
    port: number,
    timeout: number,
    transactionId: Uint8Array,
  ): Promise<Uint8Array> {
    const t = buf2hex(transactionId);
    const sock = this.getSocket();
    if (!sock) throw new Error("Socket closed");

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(t);
        reject(new FetchLayerTimeoutError("bittorrent", timeout));
      }, timeout);

      this.pendingRequests.set(t, { resolve, reject, timer });

      sock.send(data, port, address, (err: Error | null) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(t);
          reject(err);
        }
      });
    });
  }

  onMessage(
    callback: (
      msg: DHTMessage,
      rinfo: { address: string; port: number },
    ) => void,
  ): void {
    this.messageCallbacks.push(callback);
  }

  close(): void {
    for (const [key, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Transceiver closed"));
    }
    this.pendingRequests.clear();
    if (this.socket) {
      this.getSocket().close();
    }
  }
}
