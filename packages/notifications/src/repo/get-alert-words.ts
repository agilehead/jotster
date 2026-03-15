import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, AlertWord } from "@jotster/core/Jotster.Core.js";

export const getAlertWords = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<AlertWord[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.AlertWords
      .Where((aw) => aw.TenantId === tenantId0).Where((aw) => aw.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
