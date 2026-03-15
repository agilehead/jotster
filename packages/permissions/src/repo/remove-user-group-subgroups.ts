import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeUserGroupSubgroups = async (
  options: DbContextOptions,
  parentGroupId: long,
  subgroupIds: long[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const parentGroupId0 = parentGroupId;

    for (let i = 0; i < subgroupIds.length; i++) {
      const subgroupId0 = subgroupIds[i];
      const subgroup = await db0.UserGroupSubgroups
        .Where((s) => s.ParentGroupId === parentGroupId0).Where((s) => s.SubgroupId === subgroupId0)
        .FirstOrDefaultAsync();

      if (subgroup !== undefined && subgroup !== null) {
        db0.UserGroupSubgroups.Remove(subgroup);
      }
    }
    await db0.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
