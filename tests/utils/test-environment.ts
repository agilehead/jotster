import { mkdirSync, rmSync } from "fs";
import path from "path";

const TEST_OUTPUT_DIR = path.resolve(".tests", "jotster");

mkdirSync(TEST_OUTPUT_DIR, { recursive: true });

export const TEST_DB_PATH = path.join(TEST_OUTPUT_DIR, "jotster.sqlite");

export function resetTestArtifacts(): void {
  rmSync(TEST_DB_PATH, { force: true });
}
