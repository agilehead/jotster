import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel } from "@jotster/core/Jotster.Core.js";

export const getChannels = async (
  options: DbContextOptions,
  tenantId: string,
  includeArchived: boolean
): Promise<Channel[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    if (includeArchived) {
      const result = await db0.Channels
        .Where((c) => c.TenantId === tenantId0)
        .ToArrayAsync();
      return result;
    } else {
      const zero = 0 as int;
      const result = await db0.Channels
        .Where((c) => c.TenantId === tenantId0).Where((c) => c.IsArchived === zero)
        .ToArrayAsync();
      return result;
    }
  } finally {
    db.Dispose();
  }
};
