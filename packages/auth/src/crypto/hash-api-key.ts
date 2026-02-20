import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { SHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";

export const hashApiKey = (rawKey: string): string => {
  const bytes = Encoding.UTF8.GetBytes(rawKey);
  const hash = SHA256.HashData(bytes);
  return Convert.ToHexStringLower(hash);
};
