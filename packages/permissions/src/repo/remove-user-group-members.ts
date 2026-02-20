import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeUserGroupMembers = async (
  options: DbContextOptions,
  groupId: string,
  userIds: string[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;

    for (let i = 0; i < userIds.length; i++) {
      const userId0 = userIds[i];
      const member = await db0.UserGroupMembers
        .Where((m) => m.UserGroupId === groupId0).Where((m) => m.UserId === userId0)
        .FirstOrDefaultAsync();

      if (member !== undefined && member !== null) {
        db0.UserGroupMembers.Remove(member);
      }
    }
    await db0.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
