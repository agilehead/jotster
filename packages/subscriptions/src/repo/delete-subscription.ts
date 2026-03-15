import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteSubscription = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  channelId: long
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const channelId0 = channelId;
    const sub = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0).Where((s) => s.ChannelId === channelId0)
      .FirstOrDefaultAsync();
    if (sub === undefined || sub === null) {
      return false;
    }
    db0.Subscriptions.Remove(sub);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
