import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import type { JsValue } from "@tsonic/core/types.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { getTokensForUser } from "../repo/get-tokens-for-user.ts";

export const sendTestNotificationDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<Record<string, JsValue>, string>> => {
  const tokens = await getTokensForUser(options, user.tenantId, user.userId);

  // For MVP, just return success with count of devices (actual push dispatch is out of scope)
  const result: Record<string, JsValue> = {};
  result["msg"] = "";
  result["devices_notified"] = tokens.length;
  return ok(result);
};
