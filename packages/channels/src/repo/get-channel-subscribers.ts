import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getChannelSubscribers = async (
  options: DbContextOptions,
  tenantId: string,
  channelId: string
): Promise<string[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;
    const subs = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.ChannelId === channelId0)
      .ToListAsync();

    const ids = new List<string>();
    for (let i = 0; i < subs.Count; i++) {
      const sub = subs[i];
      ids.Add(sub.UserId);
    }
    return ids.ToArray();
  } finally {
    db.Dispose();
  }
};
