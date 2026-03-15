import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserStatus } from "@jotster/core/Jotster.Core.js";

export const getAllUserStatuses = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<UserStatus[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.UserStatuses.Where(
      (s) => s.TenantId === tenantId0,
    ).ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
