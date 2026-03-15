import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { getSubscription } from "../repo/get-subscription.ts";

export const checkSubscribedDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  targetUserId: long,
  channelId: long,
): Promise<Result<boolean, string>> => {
  // Only admin or self can check
  if (actingUser.role > 200 && actingUser.userId !== targetUserId) {
    return err("Insufficient permission");
  }

  const sub = await getSubscription(
    options,
    actingUser.tenantId,
    targetUserId,
    channelId,
  );
  if (sub !== undefined) {
    return ok(true);
  }
  return ok(false);
};
