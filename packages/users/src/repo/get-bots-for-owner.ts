import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export const getBotsForOwner = async (
  options: DbContextOptions,
  tenantId: long,
  ownerId: long
): Promise<User[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const ownerId0 = ownerId;
    const isBot1 = 1 as int;
    const isActive1 = 1 as int;
    const result = await db0.Users
      .Where(
        (u) =>
          u.TenantId === tenantId0 &&
          u.IsBot === isBot1 &&
          u.BotOwnerId === ownerId0 &&
          u.IsActive === isActive1
      )
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
