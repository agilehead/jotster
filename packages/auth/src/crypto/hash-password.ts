import { Buffer } from "@tsonic/nodejs/buffer.js";
import { randomBytes } from "@tsonic/nodejs/crypto.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { SHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";

export const hashPassword = (password: string): string => {
  const salt = Buffer.from(randomBytes(16)).toString("hex");
  const bytes = Encoding.UTF8.GetBytes(salt + ":" + password);
  const hash = SHA256.HashData(bytes);
  return salt + ":" + Convert.ToHexStringLower(hash);
};
