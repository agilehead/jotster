import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, BotStorage } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getBotStorage = async (
  options: DbContextOptions,
  botUserId: string
): Promise<BotStorage[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const botUserId0 = botUserId;
    const result = await db0.BotStorages
      .Where((s) => s.BotUserId === botUserId0)
      .ToListAsync();

    const entries = new List<BotStorage>();
    for (let i = 0; i < result.Count; i++) {
      const entry = result[i];
      entries.Add(entry);
    }
    return entries.ToArray();
  } finally {
    db.Dispose();
  }
};
