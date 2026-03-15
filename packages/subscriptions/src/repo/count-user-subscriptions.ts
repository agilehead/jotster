import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const countUserSubscriptions = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<int> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .ToListAsync();
    return result.Count;
  } finally {
    db.Dispose();
  }
};
