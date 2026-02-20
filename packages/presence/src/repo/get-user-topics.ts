import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserTopic } from "@jotster/core/Jotster.Core.js";

export const getUserTopics = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<UserTopic[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.UserTopics
      .Where((t) => t.TenantId === tenantId0).Where((t) => t.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
