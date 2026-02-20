import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup } from "@jotster/core/Jotster.Core.js";

export const getUserGroups = async (
  options: DbContextOptions,
  tenantId: string
): Promise<UserGroup[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const one = 1 as int;
    const result = await db0.UserGroups
      .Where((g) => g.TenantId === tenantId0).Where((g) => g.IsActive === one)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
