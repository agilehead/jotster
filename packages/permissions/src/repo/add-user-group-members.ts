import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroupMember } from "@jotster/core/Jotster.Core.js";

export const addUserGroupMembers = async (
  options: DbContextOptions,
  groupId: string,
  userIds: string[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    for (let i = 0; i < userIds.length; i++) {
      const member = new UserGroupMember();
      member.UserGroupId = groupId;
      member.UserId = userIds[i];
      db.UserGroupMembers.Add(member);
    }
    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
