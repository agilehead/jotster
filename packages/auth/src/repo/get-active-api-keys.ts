import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ApiKey } from "@jotster/core/Jotster.Core.js";

export const getActiveApiKeys = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<ApiKey[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.ApiKeys
      .Where((k) => k.TenantId === tenantId0).Where((k) => k.UserId === userId0).Where((k) => k.RevokedAt === undefined)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
