import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const unregisterPushToken = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  token: string
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const token0 = token;
    const existing = await db0.PushDeviceTokens
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.UserId === userId0).Where((x) => x.Token === token0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      db.PushDeviceTokens.Remove(existing);
      await db.SaveChangesAsync();
    }
  } finally {
    db.Dispose();
  }
};
