import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const unmuteUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  mutedUserId: string
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const mutedUserId0 = mutedUserId;
    const existing = await db0.MutedUsers
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.UserId === userId0).Where((m) => m.MutedUserId === mutedUserId0)
      .FirstOrDefaultAsync();

    if (existing === undefined || existing === null) {
      return false;
    }

    db0.MutedUsers.Remove(existing);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
