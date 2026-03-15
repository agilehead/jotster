import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser, UserGroup } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { updateUserGroup } from "../repo/update-user-group.ts";
import { resolveGroupIdToSetting } from "../repo/resolve-group-setting.ts";

interface UpdateUserGroupDomainInput {
  name?: string;
  description?: string;
  canAddMembersGroupId?: long;
  canJoinGroupId?: long;
  canLeaveGroupId?: long;
  canManageGroupId?: long;
  canMentionGroupId?: long;
  canRemoveMembersGroupId?: long;
  deactivated?: boolean;
}

export const updateUserGroupDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: long,
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
  const isReactivating = updates.deactivated === false;
  if (group.IsActive === zero && !isReactivating) {
    return err("User group is deactivated");
  }

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length === 0) {
      return err("Group name must not be empty");
    }
    if (name.length > 100) {
      return err("Group name too long");
    }
  }

  const updated = await updateUserGroup(options, groupId, {
    name: updates.name !== undefined ? updates.name.trim() : undefined,
    description: updates.description,
    canAddMembersGroupId: updates.canAddMembersGroupId,
    canJoinGroupId: updates.canJoinGroupId,
    canLeaveGroupId: updates.canLeaveGroupId,
    canManageGroupId: updates.canManageGroupId,
    canMentionGroupId: updates.canMentionGroupId,
    canRemoveMembersGroupId: updates.canRemoveMembersGroupId,
    deactivated: updates.deactivated,
  });

  if (updated === undefined) {
    return err("User group not found");
  }

  const resolve = async (id: long | undefined | null): Promise<string | null> => {
    return await resolveGroupIdToSetting(options, user.tenantId, id);
  };

  const data: Record<string, unknown> = {};
  if (group.IsActive === zero && updated.IsActive !== zero) {
    data["op"] = "add";
    data["group"] = {
      id: updated.Id,
      name: updated.Name,
      description: updated.Description,
      is_system_group: updated.IsSystemGroup === 1,
      members: [],
      direct_subgroup_ids: [],
      can_add_members_group: await resolve(updated.CanAddMembersGroupId),
      can_join_group: await resolve(updated.CanJoinGroupId),
      can_leave_group: await resolve(updated.CanLeaveGroupId),
      can_manage_group: await resolve(updated.CanManageGroupId),
      can_mention_group: await resolve(updated.CanMentionGroupId),
      can_remove_members_group: await resolve(updated.CanRemoveMembersGroupId),
      creator_id: updated.CreatorId ?? null,
      date_created: updated.CreatedAt,
      deactivated: updated.IsActive !== 1,
    };
  } else {
    data["op"] = "update";
    data["group_id"] = groupId;
    const changedData: Record<string, unknown> = {};
    if (updates.name !== undefined) {
      changedData["name"] = updated.Name;
    }
    if (updates.description !== undefined) {
      changedData["description"] = updated.Description;
    }
    if (updates.canAddMembersGroupId !== undefined) {
      changedData["can_add_members_group"] = await resolve(updated.CanAddMembersGroupId);
    }
    if (updates.canJoinGroupId !== undefined) {
      changedData["can_join_group"] = await resolve(updated.CanJoinGroupId);
    }
    if (updates.canLeaveGroupId !== undefined) {
      changedData["can_leave_group"] = await resolve(updated.CanLeaveGroupId);
    }
    if (updates.canManageGroupId !== undefined) {
      changedData["can_manage_group"] = await resolve(updated.CanManageGroupId);
    }
    if (updates.canMentionGroupId !== undefined) {
      changedData["can_mention_group"] = await resolve(updated.CanMentionGroupId);
    }
    if (updates.canRemoveMembersGroupId !== undefined) {
      changedData["can_remove_members_group"] = await resolve(updated.CanRemoveMembersGroupId);
    }
    if (updates.deactivated === false) {
      changedData["deactivated"] = updated.IsActive !== 1;
    }
    data["data"] = changedData;
  }

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data,
  });

  return ok(updated);
};
