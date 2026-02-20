import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, PushDeviceToken } from "@jotster/core/Jotster.Core.js";

export const getTokensForUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<PushDeviceToken[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.PushDeviceTokens
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
