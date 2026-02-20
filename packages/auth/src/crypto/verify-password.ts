import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { SHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const colonIndex = storedHash.IndexOf(":");
  if (colonIndex < 0) return false;
  const salt = storedHash.Substring(0, colonIndex);
  const expectedHash = storedHash.Substring(colonIndex + 1);
  const bytes = Encoding.UTF8.GetBytes(salt + ":" + password);
  const hash = SHA256.HashData(bytes);
  return Convert.ToHexStringLower(hash) === expectedHash;
};
