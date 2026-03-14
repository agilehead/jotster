import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeChannelFromAllFolders = async (
  options: DbContextOptions,
  channelId: string
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const channelId0 = channelId;

    const items = await db0.ChannelFolderItems
      .Where((item) => item.ChannelId === channelId0)
      .ToListAsync();

    for (let i = 0; i < items.Count; i++) {
      const item = items[i];
      db0.ChannelFolderItems.Remove(item);
    }

    if (items.Count > 0) {
      await db0.SaveChangesAsync();
    }
  } finally {
    db.Dispose();
  }
};
