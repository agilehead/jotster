import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const isDefaultChannel = async (
  options: DbContextOptions,
  tenantId: long,
  channelId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;
    const result = await db0.DefaultChannels.Where(
      (d) => d.TenantId === tenantId0,
    )
      .Where((d) => d.ChannelId === channelId0)
      .FirstOrDefaultAsync();
    return result !== undefined && result !== null;
  } finally {
    db.Dispose();
  }
};
