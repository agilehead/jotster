import os from "node:os";
import { spawn } from "node:child_process";

export const tsonicBin = process.env.TSONIC_BIN ?? "tsonic";
export const skipRestore =
  process.env.JOTSTER_SKIP_RESTORE === "1" ||
  process.argv.includes("--skip-restore");

export const packageNames = [
  "core",
  "identity",
  "authorization",
  "collaboration",
  "notifications",
  "api-native",
  "api-agent",
  "api-zulip",
  "server",
];

export const coreDependentPackages = [
  "identity",
  "authorization",
  "collaboration",
  "notifications",
  "api-native",
  "api-agent",
  "api-zulip",
];

export function defaultParallelism(taskCount) {
  const configured = Number.parseInt(process.env.JOTSTER_PARALLELISM ?? "", 10);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(configured, taskCount);
  }
  return Math.max(1, Math.min(os.availableParallelism?.() ?? os.cpus().length, taskCount));
}

export async function restoreWorkspace() {
  if (skipRestore) {
    console.log("=== restore ===");
    console.log("$ skipped; caller already restored the workspace");
    return;
  }

  await runCommand("restore", tsonicBin, ["restore"]);
}

export function runCommand(label, command, args, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  console.log(`=== ${label} ===`);
  console.log(`$ ${[command, ...args].join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(prefixLines(label, chunk.toString()));
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(prefixLines(label, chunk.toString()));
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const detail = signal ? `signal ${signal}` : `exit ${code}`;
      reject(new Error(`${label} failed with ${detail}`));
    });
  });
}

export async function runParallel(tasks, options = {}) {
  const parallelism = options.parallelism ?? defaultParallelism(tasks.length);
  console.log(`=== parallel ===`);
  console.log(`$ running ${tasks.length} task(s) with parallelism ${parallelism}`);
  const queue = [...tasks];
  const failures = [];

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) {
        return;
      }
      try {
        await task();
      } catch (error) {
        failures.push(error);
      }
    }
  }

  const workers = Array.from({ length: parallelism }, () => worker());
  await Promise.all(workers);
  if (failures.length > 0) {
    throw failures[0];
  }
}

export function fail(error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function prefixLines(label, text) {
  const cleanLabel = label.padEnd(16, " ");
  return text
    .split(/(?<=\n)/)
    .map((line) => (line.length === 0 ? line : `[${cleanLabel}] ${line}`))
    .join("");
}
