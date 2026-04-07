import { Buffer } from "@tsonic/nodejs/buffer.js";
import { randomBytes } from "@tsonic/nodejs/crypto.js";

export const generateApiKey = (): string => {
  return Buffer.from(randomBytes(32)).toString("hex");
};
