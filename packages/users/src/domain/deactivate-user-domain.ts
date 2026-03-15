import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";
import { deactivateUser } from "../repo/deactivate-user.ts";

export const deactivateUserDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  targetUserId: long,
): Promise<Result<boolean, string>> => {
  const isSelf = actingUser.userId === targetUserId;
  const isAdmin = actingUser.role <= 200;

  // Must be admin or self-deactivation
  if (!isSelf && !isAdmin) {
    return err("Insufficient permission");
  }

  const targetUser = await getUser(options, targetUserId);
  if (targetUser === undefined) {
    return err("User not found");
  }

  if (targetUser.TenantId !== actingUser.tenantId) {
    return err("User not found");
  }

  // Cannot deactivate the last owner
  if (targetUser.Role === (100 as int)) {
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = actingUser.tenantId;
      const ownerRole = 100 as int;
      const activeStatus = 1 as int;
      const owners = await db0.Users.Where(
        (u) =>
          u.TenantId === tenantId0 &&
          u.Role === ownerRole &&
          u.IsActive === activeStatus,
      ).ToArrayAsync();

      if (owners[1] === undefined) {
        return err("Cannot deactivate the only organization owner");
      }
    } finally {
      db.Dispose();
    }
  }

  const result = await deactivateUser(
    options,
    actingUser.tenantId,
    targetUserId,
  );
  if (!result) {
    return err("Failed to deactivate user");
  }

  return ok(true);
};
