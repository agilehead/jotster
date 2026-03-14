import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Subscription } from "@jotster/core/Jotster.Core.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getSubscriptionsForChannel = async (
  options: DbContextOptions,
  tenantId: string,
  channelId: string
): Promise<List<Subscription>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;
    const result = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.ChannelId === channelId0)
      .ToListAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
