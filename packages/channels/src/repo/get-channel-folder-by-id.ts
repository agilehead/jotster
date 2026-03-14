import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder, ChannelFolderItem } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

interface ChannelFolderWithItems {
  folder: ChannelFolder;
  items: ChannelFolderItem[];
}

export const getChannelFolderById = async (
  options: DbContextOptions,
  folderId: string
): Promise<ChannelFolderWithItems | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const folderId0 = folderId;

    const folder = await db0.ChannelFolders
      .Where((f) => f.Id === folderId0)
      .FirstOrDefaultAsync();

    if (folder === undefined) {
      return undefined;
    }

    const items = await db0.ChannelFolderItems
      .Where((item) => item.ChannelFolderId === folderId0)
      .ToListAsync();

    const itemList = new List<ChannelFolderItem>();
    for (let i = 0; i < items.Count; i++) {
      const item = items[i];
      itemList.Add(item);
    }

    return { folder, items: itemList.ToArray() };
  } finally {
    db.Dispose();
  }
};
