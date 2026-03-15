import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser, UserGroup } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { addUserGroupMembers } from "../repo/add-user-group-members.ts";
import { createUserGroup } from "../repo/create-user-group.ts";
import { resolveGroupIdToSetting } from "../repo/resolve-group-setting.ts";

interface CreateUserGroupDomainInput {
  name: string;
  description?: string;
  members?: long[];
  canAddMembersGroupId?: long;
  canJoinGroupId?: long;
  canLeaveGroupId?: long;
  canManageGroupId?: long;
  canMentionGroupId?: long;
  canRemoveMembersGroupId?: long;
}

export const createUserGroupDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateUserGroupDomainInput
): Promise<Result<UserGroup, string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const name = input.name.trim();

  if (name.length === 0) {
    return err("Group name must not be empty");
  }

  if (name.length > 100) {
    return err("Group name too long");
  }

  const group = await createUserGroup(options, {
    tenantId: user.tenantId,
    creatorId: user.userId,
    name,
    description: input.description,
    canAddMembersGroupId: input.canAddMembersGroupId,
    canJoinGroupId: input.canJoinGroupId,
    canLeaveGroupId: input.canLeaveGroupId,
    canManageGroupId: input.canManageGroupId,
    canMentionGroupId: input.canMentionGroupId,
    canRemoveMembersGroupId: input.canRemoveMembersGroupId,
  });

  const members = input.members ?? [];
  if (members.length > 0) {
    await addUserGroupMembers(options, group.Id, members);
  }

  const resolve = async (id: long | undefined | null): Promise<string | null> => {
    return await resolveGroupIdToSetting(options, user.tenantId, id);
  };

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data: {
      op: "add",
      group: {
        id: group.Id,
        name: group.Name,
        description: group.Description,
        is_system_group: group.IsSystemGroup === 1,
        members,
        direct_subgroup_ids: [],
        can_add_members_group: await resolve(group.CanAddMembersGroupId),
        can_join_group: await resolve(group.CanJoinGroupId),
        can_leave_group: await resolve(group.CanLeaveGroupId),
        can_manage_group: await resolve(group.CanManageGroupId),
        can_mention_group: await resolve(group.CanMentionGroupId),
        can_remove_members_group: await resolve(group.CanRemoveMembersGroupId),
        creator_id: group.CreatorId ?? null,
        date_created: group.CreatedAt,
        deactivated: group.IsActive !== 1,
      },
    },
  });

  return ok(group);
};
