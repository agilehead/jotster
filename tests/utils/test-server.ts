import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { TEST_DB_PATH } from "./test-environment.js";

const SERVER_PORT = 9877;
const SERVER_HOST = "127.0.0.1";
const BUILD_OUTPUT_DIR = path.resolve("packages/server/generated/bin/Release/net10.0/linux-x64");
const NATIVE_BINARY_PATH = path.join(BUILD_OUTPUT_DIR, "jotster");
const MANAGED_BINARY_PATH = path.join(BUILD_OUTPUT_DIR, "jotster.dll");

type LaunchTarget = {
  command: string;
  args: string[];
  description: string;
};

function resolveLaunchTarget(): LaunchTarget | null {
  if (existsSync(NATIVE_BINARY_PATH)) {
    return {
      command: NATIVE_BINARY_PATH,
      args: [],
      description: NATIVE_BINARY_PATH,
    };
  }

  if (existsSync(MANAGED_BINARY_PATH)) {
    return {
      command: "dotnet",
      args: [MANAGED_BINARY_PATH],
      description: `dotnet ${MANAGED_BINARY_PATH}`,
    };
  }

  return null;
}

export class TestServer {
  private process: ChildProcess | null = null;
  private baseUrl: string;
  private recentOutput: string[] = [];

  constructor() {
    this.baseUrl = `http://${SERVER_HOST}:${SERVER_PORT}`;
  }

  async start(): Promise<void> {
    const launchTarget = resolveLaunchTarget();
    if (launchTarget === null) {
      throw new Error(
        `Server build output not found. Checked ${NATIVE_BINARY_PATH} and ${MANAGED_BINARY_PATH}. Run the server build before tests.`,
      );
    }

    this.process = spawn(launchTarget.command, launchTarget.args, {
      env: {
        ...process.env,
        JOTSTER_LISTEN_URL: this.baseUrl,
        JOTSTER_DB: TEST_DB_PATH,
        JOTSTER_ROOT_TOKEN: "test-root-token",
        JOTSTER_MODE: "multi-tenant",
      },
      stdio: "pipe",
    });

    this.process.stdout?.on("data", (chunk) => this.captureOutput(String(chunk)));
    this.process.stderr?.on("data", (chunk) => this.captureOutput(String(chunk)));

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
      if (this.process === null) {
        throw new Error("Server process was not started.");
      }

      if (this.process.exitCode !== null || this.process.signalCode !== null) {
        const status = this.process.exitCode !== null ? `exit code ${this.process.exitCode}` : `signal ${this.process.signalCode}`;
        const details = this.recentOutput.length > 0 ? `\nRecent server output:\n${this.recentOutput.join("")}` : "";
        throw new Error(`Server exited before becoming ready (${status}).${details}`);
      }

      try {
        const res = await fetch(`${this.baseUrl}/health`);
        if (res.ok) return;
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const details = this.recentOutput.length > 0 ? `\nRecent server output:\n${this.recentOutput.join("")}` : "";
    throw new Error(`Server failed to start within timeout.${details}`);
  }

  private captureOutput(chunk: string): void {
    this.recentOutput.push(chunk);
    if (this.recentOutput.length > 20) {
      this.recentOutput.shift();
    }
  }
}
