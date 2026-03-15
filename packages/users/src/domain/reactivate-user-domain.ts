import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";
import { reactivateUser } from "../repo/reactivate-user.ts";

export const reactivateUserDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  targetUserId: long,
): Promise<Result<boolean, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  const targetUser = await getUser(options, targetUserId);
  if (targetUser === undefined) {
    return err("User not found");
  }

  if (targetUser.TenantId !== actingUser.tenantId) {
    return err("User not found");
  }

  if (targetUser.IsActive === (1 as int)) {
    return err("User is already active");
  }

  const result = await reactivateUser(
    options,
    actingUser.tenantId,
    targetUserId,
  );
  if (!result) {
    return err("Failed to reactivate user");
  }

  return ok(true);
};
