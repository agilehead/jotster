import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { unregisterPushToken } from "../repo/unregister-push-token.ts";

export const unregisterDeviceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  token: string,
): Promise<Result<Record<string, unknown>, string>> => {
  await unregisterPushToken(options, user.tenantId, user.userId, token);

  const result: Record<string, unknown> = {};
  result["msg"] = "";
  return ok(result);
};
