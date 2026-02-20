import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserStatus } from "@jotster/core/Jotster.Core.js";

export const getUserStatus = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<UserStatus | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.UserStatuses
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
