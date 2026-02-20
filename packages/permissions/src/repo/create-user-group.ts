import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateUserGroupInput {
  tenantId: string;
  name: string;
  description?: string;
  canAddMembersGroupId?: string;
  canJoinGroupId?: string;
  canLeaveGroupId?: string;
  canManageGroupId?: string;
  canMentionGroupId?: string;
}

export const createUserGroup = async (
  options: DbContextOptions,
  input: CreateUserGroupInput
): Promise<UserGroup> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const group = new UserGroup();
  group.Id = generateId();
  group.TenantId = input.tenantId;
  group.Name = input.name;
  group.Description = input.description ?? "";
  group.IsSystemGroup = 0 as int;
  group.CanAddMembersGroupId = input.canAddMembersGroupId;
  group.CanJoinGroupId = input.canJoinGroupId;
  group.CanLeaveGroupId = input.canLeaveGroupId;
  group.CanManageGroupId = input.canManageGroupId;
  group.CanMentionGroupId = input.canMentionGroupId;
  group.IsActive = 1 as int;
  group.CreatedAt = now;
  group.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.UserGroups.Add(group);
    await db.SaveChangesAsync();
    return group;
  } finally {
    db.Dispose();
  }
};
