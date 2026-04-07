import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const getChannelForAccessCheck = async (
  options: DbContextOptions,
  tenantId: long,
  channelId: long,
): Promise<
  { isPrivate: boolean; isWebPublic: boolean; isArchived: boolean } | undefined
> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;

    const ch = await db0.Channels.Where((c) => c.Id === channelId0)
      .Where((c) => c.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (ch == null) {
      return undefined;
    }

    const one = 1 as int;
    return {
      isPrivate: ch.IsPrivate === one,
      isWebPublic: ch.IsWebPublic === one,
      isArchived: ch.IsArchived === one,
    };
  } finally {
    db.Dispose();
  }
};
