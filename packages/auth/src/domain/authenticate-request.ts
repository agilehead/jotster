import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { hashApiKey } from "../crypto/hash-api-key.ts";
import { getApiKeyByHash } from "../repo/get-api-key-by-hash.ts";
import { getUserById } from "../repo/get-user-by-id.ts";

export const authenticateRequest = async (
  options: DbContextOptions,
  authHeader: string,
): Promise<Result<AuthenticatedUser, string>> => {
  if (!authHeader.startsWith("Basic ")) {
    return err("Authentication required");
  }

  const encoded = authHeader.substring(6).trim();
  const decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));

  const colonIdx = decoded.indexOf(":");
  if (colonIdx < 0) {
    return err("Authentication required");
  }

  const email = decoded.substring(0, colonIdx);
  const apiKey = decoded.substring(colonIdx + 1);

  const keyHash = hashApiKey(apiKey);
  const apiKeyRecord = await getApiKeyByHash(options, keyHash);
  if (apiKeyRecord === undefined) {
    return err("Invalid API key");
  }

  const user = await getUserById(options, apiKeyRecord.UserId);
  if (user === undefined || user.IsActive !== 1) {
    return err("User deactivated");
  }

  const authUser = new AuthenticatedUser();
  authUser.tenantId = apiKeyRecord.TenantId;
  authUser.userId = user.Id;
  authUser.email = user.Email;
  authUser.role = user.Role;
  authUser.isBot = user.IsBot;
  authUser.botType = user.BotType ?? undefined;
  return ok(authUser);
};
