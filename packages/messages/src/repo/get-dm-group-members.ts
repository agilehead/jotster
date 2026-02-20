import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DmGroupMember } from "@jotster/core/Jotster.Core.js";

export const getDmGroupMembers = async (
  options: DbContextOptions,
  dmGroupId: string
): Promise<DmGroupMember[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const dmGroupId0 = dmGroupId;
    const result = await db0.DmGroupMembers
      .Where((m) => m.DmGroupId === dmGroupId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
