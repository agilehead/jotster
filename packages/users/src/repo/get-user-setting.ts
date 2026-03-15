import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserSetting } from "@jotster/core/Jotster.Core.js";

export const getUserSetting = async (
  options: DbContextOptions,
  userId: long,
): Promise<UserSetting | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const result = await db0.UserSettings.Where(
      (s) => s.UserId === userId0,
    ).FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
