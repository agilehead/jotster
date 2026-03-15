import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { deactivateUserGroup } from "../repo/deactivate-user-group.ts";

export const deactivateUserGroupDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: long
): Promise<Result<boolean, string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const group = await getUserGroupById(options, groupId);
  if (group === undefined) {
    return err("User group not found");
  }

  const zero = 0 as int;
  if (group.IsActive === zero) {
    return err("User group is already deactivated");
  }

  const one = 1 as int;
  if (group.IsSystemGroup === one) {
    return err("Cannot deactivate a system group");
  }

  const result = await deactivateUserGroup(options, groupId);

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data: {
      op: "remove",
      group_id: groupId,
    },
  });

  return ok(result);
};
