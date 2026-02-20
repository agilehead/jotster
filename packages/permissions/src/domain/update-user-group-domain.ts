import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser, UserGroup } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { updateUserGroup } from "../repo/update-user-group.ts";

interface UpdateUserGroupDomainInput {
  name?: string;
  description?: string;
  canAddMembersGroupId?: string;
  canJoinGroupId?: string;
  canLeaveGroupId?: string;
  canManageGroupId?: string;
  canMentionGroupId?: string;
}

export const updateUserGroupDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: string,
  updates: UpdateUserGroupDomainInput
): Promise<Result<UserGroup, string>> => {
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

  if (updates.name !== undefined) {
    const name = updates.name.Trim();
    if (name.Length === 0) {
      return err("Group name must not be empty");
    }
    if (name.Length > 100) {
      return err("Group name too long");
    }
  }

  const updated = await updateUserGroup(options, groupId, {
    name: updates.name !== undefined ? updates.name.Trim() : undefined,
    description: updates.description,
    canAddMembersGroupId: updates.canAddMembersGroupId,
    canJoinGroupId: updates.canJoinGroupId,
    canLeaveGroupId: updates.canLeaveGroupId,
    canManageGroupId: updates.canManageGroupId,
    canMentionGroupId: updates.canMentionGroupId,
  });

  if (updated === undefined) {
    return err("User group not found");
  }

  const data: Record<string, unknown> = {};
  data["op"] = "update";
  data["group_id"] = groupId;
  if (updates.name !== undefined) {
    data["name"] = updated.Name;
  }
  if (updates.description !== undefined) {
    data["description"] = updated.Description;
  }

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data,
  });

  return ok(updated);
};
