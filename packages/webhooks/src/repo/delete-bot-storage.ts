import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteBotStorage = async (
  options: DbContextOptions,
  botUserId: long,
  key?: string
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    if (key === undefined || key.trim().length === 0) {
      const db0 = db;
      const botUserId0 = botUserId;
      const entries = await db0.BotStorages
        .Where((s) => s.BotUserId === botUserId0)
        .ToListAsync();

      for (let i = 0; i < entries.Count; i++) {
        db0.BotStorages.Remove(entries[i]);
      }

      await db0.SaveChangesAsync();
      return true;
    }

    const db1 = db;
    const botUserId1 = botUserId;
    const key0 = key;
    const entry = await db1.BotStorages
      .Where((s) => s.BotUserId === botUserId1).Where((s) => s.Key === key0)
      .FirstOrDefaultAsync();

    if (entry === undefined || entry === null) {
      return false;
    }

    db1.BotStorages.Remove(entry);
    await db1.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
