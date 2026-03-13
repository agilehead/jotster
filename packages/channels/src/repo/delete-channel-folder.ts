import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteChannelFolder = async (
  options: DbContextOptions,
  folderId: string
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const folderId0 = folderId;

    const folder = await db0.ChannelFolders
      .Where((f) => f.Id === folderId0)
      .FirstOrDefaultAsync();

    if (folder === undefined) {
      return false;
    }

    // Remove all items in the folder
    const items = await db0.ChannelFolderItems
      .Where((item) => item.ChannelFolderId === folderId0)
      .ToArrayAsync();

    for (let i = 0; i < items.length; i++) {
      db0.ChannelFolderItems.Remove(items[i]);
    }

    // Remove the folder itself
    db0.ChannelFolders.Remove(folder);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
