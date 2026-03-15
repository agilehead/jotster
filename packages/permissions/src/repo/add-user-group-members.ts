import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  UserGroupMember,
} from "@jotster/core/Jotster.Core.js";

export const addUserGroupMembers = async (
  options: DbContextOptions,
  groupId: long,
  userIds: long[],
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
