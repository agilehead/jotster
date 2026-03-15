import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, BotStorage } from "@jotster/core/Jotster.Core.js";

export const setBotStorage = async (
  options: DbContextOptions,
  botUserId: long,
  key: string,
  value: string
): Promise<BotStorage> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const botUserId0 = botUserId;
    const key0 = key;
    const existing = await db0.BotStorages
      .Where((s) => s.BotUserId === botUserId0).Where((s) => s.Key === key0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      existing.Value = value;
      await db0.SaveChangesAsync();
      return existing;
    }

    const entry = new BotStorage();
    entry.BotUserId = botUserId;
    entry.Key = key;
    entry.Value = value;
    db0.BotStorages.Add(entry);
    await db0.SaveChangesAsync();
    return entry;
  } finally {
    db.Dispose();
  }
};
