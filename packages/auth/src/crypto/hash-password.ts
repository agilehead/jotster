import { crypto, Buffer } from "@tsonic/nodejs/index.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { SHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";

export const hashPassword = (password: string): string => {
  const salt = Buffer.from(crypto.randomBytes(16)).toString("hex");
  const bytes = Encoding.UTF8.GetBytes(salt + ":" + password);
  const hash = SHA256.HashData(bytes);
  return salt + ":" + Convert.ToHexStringLower(hash);
};
