import {
  fail,
  packageNames,
  restoreWorkspace,
  runCommand,
  runParallel,
} from "./workspace-runner.mjs";

const tscBin = "node_modules/typescript/bin/tsc";

async function main() {
  await restoreWorkspace();
  await runParallel(
    packageNames.map((project) => () =>
      runCommand(`typecheck:${project}`, process.execPath, [
        tscBin,
        "-p",
        `packages/${project}/tsconfig.json`,
      ])
    )
  );
}

main().catch(fail);
