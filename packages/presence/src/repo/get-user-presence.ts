import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Presence } from "@jotster/core/Jotster.Core.js";

export const getUserPresence = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<Presence[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.Presences
      .Where((p) => p.TenantId === tenantId0).Where((p) => p.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
