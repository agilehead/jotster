import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeAllTokensForUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const tokens = await db0.PushDeviceTokens
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.UserId === userId0)
      .ToArrayAsync();

    for (let i = 0; i < tokens.length; i++) {
      db.PushDeviceTokens.Remove(tokens[i]);
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
