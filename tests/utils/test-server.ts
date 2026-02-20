import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import path from "path";

const SERVER_PORT = 9877;
const SERVER_HOST = "localhost";
const BINARY_PATH = path.resolve("packages/server/generated/bin/Release/net10.0/linux-x64/jotster");

export class TestServer {
  private process: ChildProcess | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `http://${SERVER_HOST}:${SERVER_PORT}`;
  }

  async start(): Promise<void> {
    if (!existsSync(BINARY_PATH)) {
      console.warn(`Server binary not found at ${BINARY_PATH}, skipping server start`);
      return;
    }

    this.process = spawn(BINARY_PATH, [], {
      env: {
        ...process.env,
        JOTSTER_LISTEN_URL: this.baseUrl,
        JOTSTER_DB: ":memory:",
        JOTSTER_ROOT_TOKEN: "test-root-token",
        JOTSTER_MODE: "multi-tenant",
      },
      stdio: "pipe",
    });

    await this.waitForReady();
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async waitForReady(): Promise<void> {
    const maxAttempts = 50;
    const delay = 200;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${this.baseUrl}/health`);
        if (res.ok) return;
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error("Server failed to start within timeout");
  }
}
