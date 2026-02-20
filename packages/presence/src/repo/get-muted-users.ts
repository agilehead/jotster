import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, MutedUser } from "@jotster/core/Jotster.Core.js";

export const getMutedUsers = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<MutedUser[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.MutedUsers
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
