import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { addUserGroupMembers } from "../repo/add-user-group-members.ts";

export const addUserGroupMembersDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: long,
  userIds: long[],
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
    return err("User group is deactivated");
  }

  if (userIds.length === 0) {
    return err("No user IDs provided");
  }

  await addUserGroupMembers(options, groupId, userIds);

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data: {
      op: "add_members",
      group_id: groupId,
      user_ids: userIds,
    },
  });

  return ok(true);
};
