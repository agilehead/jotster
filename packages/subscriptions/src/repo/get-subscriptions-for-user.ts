import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Subscription } from "@jotster/core/Jotster.Core.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getSubscriptionsForUser = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<List<Subscription>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.Subscriptions.Where(
      (s) => s.TenantId === tenantId0,
    )
      .Where((s) => s.UserId === userId0)
      .ToListAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
