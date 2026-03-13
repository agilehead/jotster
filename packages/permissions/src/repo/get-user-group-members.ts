import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getUserGroupMembers = async (
  options: DbContextOptions,
  groupId: string
): Promise<string[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const members = await db0.UserGroupMembers
      .Where((m) => m.UserGroupId === groupId0)
      .ToArrayAsync();

    const ids = new List<string>();
    for (let i = 0; i < members.length; i++) {
      ids.Add(members[i].UserId);
    }
    return ids.ToArray();
  } finally {
    db.Dispose();
  }
};
