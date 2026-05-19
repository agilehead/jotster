import { rm } from "node:fs/promises";
import { join } from "node:path";
import {
  coreDependentPackages,
  fail,
  restoreWorkspace,
  runCommand,
  runParallel,
  tsonicBin,
} from "./workspace-runner.mjs";

async function main() {
  await restoreWorkspace();
  await rm(join("packages", "server", "generated", "bin", "Release", "net10.0", "linux-x64"), {
    force: true,
    recursive: true,
  });
  await rm(join("packages", "server", "generated", "obj", "Release", "net10.0", "linux-x64"), {
    force: true,
    recursive: true,
  });

  const serverGenerate = runCommand("generate:server", tsonicBin, [
    "generate",
    "--project",
    "server",
    "--no-restore",
  ]).then(
    () => undefined,
    (error) => error
  );

  await runCommand("build:core", tsonicBin, [
    "build",
    "--project",
    "core",
    "--no-restore",
  ]);
  await runCommand("ef:model", "bash", ["./scripts/generate-ef-compiled-model.sh"]);

  await runParallel(
    coreDependentPackages.map((project) => () =>
      runCommand(`build:${project}`, tsonicBin, [
        "build",
        "--project",
        project,
        "--no-restore",
      ])
    )
  );

  const serverGenerateError = await serverGenerate;
  if (serverGenerateError) {
    throw serverGenerateError;
  }

  await runCommand("publish:server", "dotnet", [
    "publish",
    "packages/server/generated/tsonic.csproj",
    "-c",
    "Release",
    "-r",
    "linux-x64",
    "-o",
    "packages/server/generated/bin/Release/net10.0/linux-x64",
  ]);
}

main().catch(fail);
