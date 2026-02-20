import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { addUserGroupSubgroups } from "../repo/add-user-group-subgroups.ts";

export const addUserGroupSubgroupsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: string,
  subgroupIds: string[]
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

  if (subgroupIds.length === 0) {
    return err("No subgroup IDs provided");
  }

  // Validate that all subgroup IDs refer to existing active groups
  for (let i = 0; i < subgroupIds.length; i++) {
    const subgroup = await getUserGroupById(options, subgroupIds[i]);
    if (subgroup === undefined) {
      return err("Subgroup not found: " + subgroupIds[i]);
    }
    if (subgroup.IsActive === zero) {
      return err("Subgroup is deactivated: " + subgroupIds[i]);
    }
    if (subgroupIds[i] === groupId) {
      return err("A group cannot be its own subgroup");
    }
  }

  await addUserGroupSubgroups(options, groupId, subgroupIds);

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data: {
      op: "add_subgroups",
      group_id: groupId,
      direct_subgroup_ids: subgroupIds,
    },
  });

  return ok(true);
};
