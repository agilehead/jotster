import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getUserGroupSubgroups = async (
  options: DbContextOptions,
  groupId: string
): Promise<string[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const subgroups = await db0.UserGroupSubgroups
      .Where((s) => s.ParentGroupId === groupId0)
      .ToArrayAsync();

    const ids = new List<string>();
    for (let i = 0; i < subgroups.Length; i++) {
      ids.Add(subgroups[i].SubgroupId);
    }
    return ids.ToArray();
  } finally {
    db.Dispose();
  }
};
