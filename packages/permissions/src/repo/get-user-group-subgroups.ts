import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getUserGroupSubgroups = async (
  options: DbContextOptions,
  groupId: long
): Promise<long[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const subgroups = await db0.UserGroupSubgroups
      .Where((s) => s.ParentGroupId === groupId0)
      .ToListAsync();

    const ids = new List<long>();
    for (let i = 0; i < subgroups.Count; i++) {
      const subgroup = subgroups[i];
      ids.Add(subgroup.SubgroupId);
    }
    return ids.ToArray();
  } finally {
    db.Dispose();
  }
};
