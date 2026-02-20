import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel } from "@jotster/core/Jotster.Core.js";

export const getChannelById = async (
  options: DbContextOptions,
  channelId: string
): Promise<Channel | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const channelId0 = channelId;
    const result = await db0.Channels.Where((c) => c.Id === channelId0).FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
