import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import net from "net";
import path from "path";
import { TEST_DB_PATH, TEST_UPLOADS_DIR } from "./test-environment.js";

const SERVER_HOST = "127.0.0.1";
const BUILD_OUTPUT_DIR = path.resolve("packages/server/generated/bin/Release/net10.0/linux-x64");
const NATIVE_BINARY_PATH = path.join(BUILD_OUTPUT_DIR, "jotster");
const MANAGED_BINARY_PATH = path.join(BUILD_OUTPUT_DIR, "jotster.dll");
const TEST_BASE_URL_ENV = "JOTSTER_TEST_BASE_URL";

type LaunchTarget = {
  command: string;
  args: string[];
  description: string;
};

type TestServerOptions = {
  envOverrides?: Record<string, string>;
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

async function allocatePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, SERVER_HOST, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close(() => reject(new Error("Failed to allocate test server port.")));
        return;
      }

      const { port } = address;
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve(port);
      });
    });
  });
}

export class TestServer {
  private process: ChildProcess | null = null;
  private baseUrl = "";
  private recentOutput: string[] = [];
  private readonly envOverrides: Record<string, string>;
  private previousBaseUrl: string | undefined;

  constructor(options?: TestServerOptions) {
    this.envOverrides = { ...(options?.envOverrides ?? {}) };
  }

  async start(): Promise<void> {
    const launchTarget = resolveLaunchTarget();
    if (launchTarget === null) {
      throw new Error(
        `Server build output not found. Checked ${NATIVE_BINARY_PATH} and ${MANAGED_BINARY_PATH}. Run the server build before tests.`,
      );
    }
    const port = await allocatePort();
    this.baseUrl = `http://${SERVER_HOST}:${port}`;
    this.previousBaseUrl = process.env[TEST_BASE_URL_ENV];
    process.env[TEST_BASE_URL_ENV] = this.baseUrl;

    this.process = spawn(launchTarget.command, launchTarget.args, {
      env: {
        ...process.env,
        JOTSTER_LISTEN_URL: this.baseUrl,
        JOTSTER_DB: TEST_DB_PATH,
        JOTSTER_UPLOADS_DIR: TEST_UPLOADS_DIR,
        JOTSTER_ROOT_TOKEN: "test-root-token",
        JOTSTER_JWT_SECRET: "test-jwt-secret",
        JOTSTER_MODE: "multi-tenant",
        JOTSTER_PRODUCTION: "0",
        JOTSTER_DEV_AUTH_ENABLED: "1",
        ...this.envOverrides,
      },
      stdio: "pipe",
    });

    this.process.stdout?.on("data", (chunk) => this.captureOutput(String(chunk)));
    this.process.stderr?.on("data", (chunk) => this.captureOutput(String(chunk)));

    await this.waitForReady();
  }

  async stop(): Promise<void> {
    const child = this.process;
    this.process = null;
    if (this.previousBaseUrl === undefined) {
      delete process.env[TEST_BASE_URL_ENV];
    } else {
      process.env[TEST_BASE_URL_ENV] = this.previousBaseUrl;
    }
    this.previousBaseUrl = undefined;

    if (child === null) {
      return;
    }

    child.stdout?.removeAllListeners("data");
    child.stderr?.removeAllListeners("data");

    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }

    await this.terminate(child);
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

  private async terminate(child: ChildProcess): Promise<void> {
    const waitForExit = () =>
      new Promise<void>((resolve, reject) => {
        const onExit = () => {
          child.off("error", onError);
          resolve();
        };
        const onError = (error: Error) => {
          child.off("exit", onExit);
          reject(error);
        };

        child.once("exit", onExit);
        child.once("error", onError);
      });

    child.kill("SIGTERM");

    try {
      await Promise.race([
        waitForExit(),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error("Timed out waiting for test server to stop.")), 5000);
        }),
      ]);
      return;
    } catch {
      child.kill("SIGKILL");
      await waitForExit();
    }
  }
}
