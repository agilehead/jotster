import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";

export const canUserManageChannel = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  userRole: number,
  channelId: long,
): Promise<Result<boolean, string>> => {
  // Admins can always manage channels
  if (userRole <= 200) {
    return ok(true);
  }

  // Check if user is the channel creator
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;

    const channel = await db0.Channels.Where((c) => c.Id === channelId0)
      .Where((c) => c.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (channel == null) {
      return ok(false);
    }

    if (channel.CreatorId === userId) {
      return ok(true);
    }

    return ok(false);
  } finally {
    db.Dispose();
  }
};
