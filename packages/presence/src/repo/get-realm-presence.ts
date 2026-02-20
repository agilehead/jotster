import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Presence } from "@jotster/core/Jotster.Core.js";

export const getRealmPresence = async (
  options: DbContextOptions,
  tenantId: string
): Promise<Presence[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.Presences
      .Where((p) => p.TenantId === tenantId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
