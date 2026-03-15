import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup } from "@jotster/core/Jotster.Core.js";

export const getUserGroupById = async (
  options: DbContextOptions,
  groupId: long
): Promise<UserGroup | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const result = await db0.UserGroups
      .Where((g) => g.Id === groupId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
