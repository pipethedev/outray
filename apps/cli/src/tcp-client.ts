import WebSocket from "ws";
import net from "net";
import chalk from "chalk";
import { encodeMessage, decodeMessage } from "./protocol";
import {
  TCPConnectionMessage,
  TCPDataMessage,
  TCPCloseMessage,
  TunnelProtocol,
} from "./types";

export class TCPTunnelClient {
  private ws: WebSocket | null = null;
  private localPort: number;
  private localHost: string;
  private serverUrl: string;
  private apiKey?: string;
  private remotePort?: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private assignedPort: number | null = null;
  private connections = new Map<string, net.Socket>();

  constructor(
    localPort: number,
    serverUrl: string = "wss://api.outray.dev/",
    apiKey?: string,
    localHost: string = "localhost",
    remotePort?: number,
  ) {
    this.localPort = localPort;
    this.localHost = localHost;
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.remotePort = remotePort;
  }

  public start(): void {
    this.connect();
  }

  public stop(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPing();

    // Close all local connections
    for (const [connectionId, socket] of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(): void {
    console.log(chalk.cyan("✨ Connecting to OutRay (TCP mode)..."));

    this.ws = new WebSocket(this.serverUrl);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (data) => this.handleMessage(data.toString()));
    this.ws.on("close", (code, reason) => this.handleClose(code, reason));
    this.ws.on("error", (error) => {
      console.log(chalk.red(`❌ WebSocket error: ${error.message}`));
    });
    this.ws.on("pong", () => {
      // Received pong, connection is alive
    });
  }

  private handleOpen(): void {
    console.log(chalk.green(`🔌 Linked to your local port ${this.localPort}`));
    this.startPing();

    const handshake = encodeMessage({
      type: "open_tunnel",
      apiKey: this.apiKey,
      protocol: "tcp" as TunnelProtocol,
      remotePort: this.remotePort,
    });
    this.ws?.send(handshake);
  }

  private handleMessage(data: string): void {
    try {
      const message = decodeMessage(data);

      if (message.type === "tunnel_opened") {
        this.assignedPort = message.port || null;
        console.log(chalk.magenta(`🌐 TCP Tunnel ready: ${message.url}`));
        if (this.assignedPort) {
          console.log(chalk.cyan(`📡 Remote port: ${this.assignedPort}`));
        }
        console.log(chalk.yellow("🥹 Don't close this or I'll cry softly."));
      } else if (message.type === "error") {
        console.log(chalk.red(`❌ Error: ${message.message}`));
        if (
          message.code === "AUTH_FAILED" ||
          message.code === "AUTH_REQUIRED" ||
          message.code === "LIMIT_EXCEEDED"
        ) {
          this.shouldReconnect = false;
          this.stop();
          process.exit(1);
        }
      } else if (message.type === "tcp_connection") {
        this.handleNewConnection(message as TCPConnectionMessage);
      } else if (message.type === "tcp_data") {
        this.handleTCPData(message as TCPDataMessage);
      } else if (message.type === "tcp_close") {
        this.handleTCPClose(message as TCPCloseMessage);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to parse message: ${error}`));
    }
  }

  private handleNewConnection(message: TCPConnectionMessage): void {
    const { connectionId } = message;

    // Create a new connection to the local service
    const socket = net.createConnection(
      { port: this.localPort, host: this.localHost },
      () => {
        console.log(chalk.dim(`← New TCP connection: ${connectionId}`));
      },
    );

    this.connections.set(connectionId, socket);

    // Forward data from local service to remote
    socket.on("data", (data) => {
      console.log(chalk.dim(`← Got ${data.length} bytes from local service`));
      if (this.ws?.readyState === WebSocket.OPEN) {
        const response: TCPDataMessage = {
          type: "tcp_data",
          connectionId,
          data: data.toString("base64"),
        };
        this.ws.send(encodeMessage(response));
        console.log(chalk.dim(`← Sent response back to server`));
      }
    });

    socket.on("close", () => {
      this.connections.delete(connectionId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        const closeMsg: TCPCloseMessage = {
          type: "tcp_close",
          connectionId,
        };
        this.ws.send(encodeMessage(closeMsg));
      }
    });

    socket.on("error", (err) => {
      console.log(
        chalk.dim(`TCP connection error ${connectionId}: ${err.message}`),
      );
      this.connections.delete(connectionId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        const closeMsg: TCPCloseMessage = {
          type: "tcp_close",
          connectionId,
        };
        this.ws.send(encodeMessage(closeMsg));
      }
    });
  }

  private handleTCPData(message: TCPDataMessage): void {
    const socket = this.connections.get(message.connectionId);
    if (socket) {
      const data = Buffer.from(message.data, "base64");
      console.log(
        chalk.dim(`→ Forwarding ${data.length} bytes to local service`),
      );
      socket.write(data);
    } else {
      console.log(
        chalk.dim(`⚠ No connection found for ${message.connectionId}`),
      );
    }
  }

  private handleTCPClose(message: TCPCloseMessage): void {
    const socket = this.connections.get(message.connectionId);
    if (socket) {
      socket.end();
      this.connections.delete(message.connectionId);
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleClose(code?: number, reason?: Buffer): void {
    this.stopPing();

    // Close all local connections
    for (const [, socket] of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    if (!this.shouldReconnect) return;

    const reasonStr = reason?.toString() || "";

    if (code === 1000 && reasonStr === "Tunnel stopped by user") {
      console.log(chalk.red("\n🛑 Tunnel stopped by user via dashboard."));
      this.stop();
      process.exit(0);
    }

    console.log(chalk.yellow("😵 Disconnected from OutRay. Retrying in 2s…"));

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2000);
  }
}
