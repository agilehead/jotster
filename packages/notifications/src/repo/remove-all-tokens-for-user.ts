import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeAllTokensForUser = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const tokens = await db0.PushDeviceTokens.Where(
      (x) => x.TenantId === tenantId0,
    )
      .Where((x) => x.UserId === userId0)
      .ToListAsync();

    for (let i = 0; i < tokens.Count; i++) {
      const token = tokens[i];
      db.PushDeviceTokens.Remove(token);
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
