import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroupSubgroup } from "@jotster/core/Jotster.Core.js";

export const addUserGroupSubgroups = async (
  options: DbContextOptions,
  parentGroupId: string,
  subgroupIds: string[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    for (let i = 0; i < subgroupIds.length; i++) {
      const subgroup = new UserGroupSubgroup();
      subgroup.ParentGroupId = parentGroupId;
      subgroup.SubgroupId = subgroupIds[i];
      db.UserGroupSubgroups.Add(subgroup);
    }
    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
