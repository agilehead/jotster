import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const isUserSubscribedToChannel = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  channelId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const channelId0 = channelId;

    const sub = await db0.Subscriptions.Where(
      (s) =>
        s.TenantId === tenantId0 &&
        s.UserId === userId0 &&
        s.ChannelId === channelId0,
    ).FirstOrDefaultAsync();

    return sub !== undefined;
  } finally {
    db.Dispose();
  }
};
