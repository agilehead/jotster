import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteBotStorage = async (
  options: DbContextOptions,
  botUserId: string,
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

    const db0 = db;
    const botUserId0 = botUserId;
    const key0 = key;
    const entry = await db0.BotStorages
      .Where((s) => s.BotUserId === botUserId0).Where((s) => s.Key === key0)
      .FirstOrDefaultAsync();

    if (entry === undefined || entry === null) {
      return false;
    }

    db0.BotStorages.Remove(entry);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
