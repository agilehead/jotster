import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel } from "@jotster/core/Jotster.Core.js";

export const getChannelByName = async (
  options: DbContextOptions,
  tenantId: long,
  name: string
): Promise<Channel | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const name0 = name;
    const result = await db0.Channels
      .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === name0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
