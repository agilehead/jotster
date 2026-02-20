import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup } from "@jotster/core/Jotster.Core.js";

interface UpdateUserGroupInput {
  name?: string;
  description?: string;
  canAddMembersGroupId?: string;
  canJoinGroupId?: string;
  canLeaveGroupId?: string;
  canManageGroupId?: string;
  canMentionGroupId?: string;
}

export const updateUserGroup = async (
  options: DbContextOptions,
  groupId: string,
  updates: UpdateUserGroupInput
): Promise<UserGroup | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const group = await db0.UserGroups
      .Where((g) => g.Id === groupId0)
      .FirstOrDefaultAsync();

    if (group === undefined) {
      return undefined;
    }

    if (updates.name !== undefined) {
      group.Name = updates.name;
    }
    if (updates.description !== undefined) {
      group.Description = updates.description;
    }
    if (updates.canAddMembersGroupId !== undefined) {
      group.CanAddMembersGroupId = updates.canAddMembersGroupId;
    }
    if (updates.canJoinGroupId !== undefined) {
      group.CanJoinGroupId = updates.canJoinGroupId;
    }
    if (updates.canLeaveGroupId !== undefined) {
      group.CanLeaveGroupId = updates.canLeaveGroupId;
    }
    if (updates.canManageGroupId !== undefined) {
      group.CanManageGroupId = updates.canManageGroupId;
    }
    if (updates.canMentionGroupId !== undefined) {
      group.CanMentionGroupId = updates.canMentionGroupId;
    }

    group.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return group;
  } finally {
    db.Dispose();
  }
};
