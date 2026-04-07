import { Buffer } from "@tsonic/nodejs/buffer.js";
import { randomBytes } from "@tsonic/nodejs/crypto.js";

export function generateId(): string {
  return Buffer.from(randomBytes(16)).toString("hex");
}
