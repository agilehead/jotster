import { resolve } from "node:path";
import Mocha from "mocha";

const mocha = new Mocha({ timeout: 60000 });
mocha.addFile(resolve("tests/index.ts"));
await mocha.loadFilesAsync();

const failures = await new Promise((resolveRun) => {
  mocha.run(resolveRun);
});

process.exitCode = failures === 0 ? 0 : 1;
