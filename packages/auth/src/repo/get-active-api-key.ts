import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ApiKey } from "@jotster/core/Jotster.Core.js";

export const getActiveApiKey = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
): Promise<ApiKey | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db.ApiKeys
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.UserId === userId0)
      .Where((entry) => entry.RevokedAt === undefined)
      .OrderByDescending((entry) => entry.CreatedAt)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
