import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup } from "@jotster/core/Jotster.Core.js";

export const getUserGroups = async (
  options: DbContextOptions,
  tenantId: long,
  includeDeactivated?: boolean,
): Promise<UserGroup[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    let query = db0.UserGroups.Where((g) => g.TenantId === tenantId0);
    if (includeDeactivated !== true) {
      const one = 1 as int;
      query = query.Where((g) => g.IsActive === one);
    }
    const result = await query.ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
