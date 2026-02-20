import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser, UserGroup } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createUserGroup } from "../repo/create-user-group.ts";

interface CreateUserGroupDomainInput {
  name: string;
  description?: string;
  canAddMembersGroupId?: string;
  canJoinGroupId?: string;
  canLeaveGroupId?: string;
  canManageGroupId?: string;
  canMentionGroupId?: string;
}

export const createUserGroupDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateUserGroupDomainInput
): Promise<Result<UserGroup, string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const name = input.name.Trim();

  if (name.Length === 0) {
    return err("Group name must not be empty");
  }

  if (name.Length > 100) {
    return err("Group name too long");
  }

  const group = await createUserGroup(options, {
    tenantId: user.tenantId,
    name,
    description: input.description,
    canAddMembersGroupId: input.canAddMembersGroupId,
    canJoinGroupId: input.canJoinGroupId,
    canLeaveGroupId: input.canLeaveGroupId,
    canManageGroupId: input.canManageGroupId,
    canMentionGroupId: input.canMentionGroupId,
  });

  dispatchEventToTenant(user.tenantId, {
    type: "user_group",
    data: {
      op: "add",
      group: {
        id: group.Id,
        name: group.Name,
        description: group.Description,
        is_system_group: group.IsSystemGroup === 1,
        members: [],
        direct_subgroup_ids: [],
        can_add_members_group: group.CanAddMembersGroupId ?? null,
        can_join_group: group.CanJoinGroupId ?? null,
        can_leave_group: group.CanLeaveGroupId ?? null,
        can_manage_group: group.CanManageGroupId ?? null,
        can_mention_group: group.CanMentionGroupId ?? null,
      },
    },
  });

  return ok(group);
};
