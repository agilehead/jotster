import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  DefaultChannel,
} from "@jotster/core/Jotster.Core.js";

export const getDefaultChannels = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<DefaultChannel[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.DefaultChannels.Where(
      (d) => d.TenantId === tenantId0,
    ).ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
