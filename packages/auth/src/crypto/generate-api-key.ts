import { crypto, Buffer } from "@tsonic/nodejs/index.js";

export const generateApiKey = (): string => {
  return Buffer.from(crypto.randomBytes(32)).toString("hex");
};
