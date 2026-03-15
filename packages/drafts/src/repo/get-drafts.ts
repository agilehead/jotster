import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Draft } from "@jotster/core/Jotster.Core.js";

export const getDrafts = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<Draft[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.Drafts
      .Where((d) => d.TenantId === tenantId0).Where((d) => d.UserId === userId0)
      .OrderByDescending((d) => d.UpdatedAt)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
