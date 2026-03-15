import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeDefaultChannel = async (
  options: DbContextOptions,
  tenantId: long,
  channelId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;
    const defaultChannel = await db0.DefaultChannels.Where(
      (d) => d.TenantId === tenantId0,
    )
      .Where((d) => d.ChannelId === channelId0)
      .FirstOrDefaultAsync();

    if (defaultChannel === undefined) {
      return false;
    }

    db0.DefaultChannels.Remove(defaultChannel);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
