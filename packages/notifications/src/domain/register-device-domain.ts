import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { registerPushToken } from "../repo/register-push-token.ts";
import { getTokensByToken } from "../repo/get-tokens-by-token.ts";
import { unregisterPushToken } from "../repo/unregister-push-token.ts";

export const registerDeviceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  kind: string,
  token: string,
  iosAppId: string | undefined
): Promise<Result<Record<string, unknown>, string>> => {
  // Validate token is non-empty
  if (!token || token.Trim().Length === 0) {
    return err("Token must not be empty");
  }

  // For APNs tokens, validate hex format
  if (kind === "apns") {
    const trimmedToken = token.Trim();
    for (let i = 0; i < trimmedToken.Length; i++) {
      const c = trimmedToken[i];
      const isHex =
        (c >= "0" && c <= "9") ||
        (c >= "a" && c <= "f") ||
        (c >= "A" && c <= "F");
      if (!isHex) {
        return err("Invalid APNs token: must be hexadecimal");
      }
    }
  }

  // Check if same token is registered to a different user — if so, unregister from other user first
  const existingTokens = await getTokensByToken(options, user.tenantId, token);
  for (let i = 0; i < existingTokens.Length; i++) {
    if (existingTokens[i].UserId !== user.userId) {
      await unregisterPushToken(
        options,
        existingTokens[i].TenantId,
        existingTokens[i].UserId,
        token
      );
    }
  }

  // Upsert via registerPushToken
  await registerPushToken(options, user.tenantId, user.userId, kind, token, iosAppId);

  const result: Record<string, unknown> = {};
  result["msg"] = "";
  return ok(result);
};
