import { crypto, Buffer } from "@tsonic/nodejs/index.js";

export function generateId(): string {
  return Buffer.from(crypto.randomBytes(16)).toString("hex");
}
