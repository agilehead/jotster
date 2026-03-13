import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder, ChannelFolderItem } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

interface ChannelFolderWithItems {
  folder: ChannelFolder;
  items: ChannelFolderItem[];
}

export const getChannelFolders = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<ChannelFolderWithItems[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;

    const folders = await db0.ChannelFolders
      .Where((f) => f.TenantId === tenantId0).Where((f) => f.UserId === userId0)
      .ToArrayAsync();

    const result = new List<ChannelFolderWithItems>();
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const folderId0 = folder.Id;
      const items = await db0.ChannelFolderItems
        .Where((item) => item.ChannelFolderId === folderId0)
        .ToArrayAsync();

      const itemList = new List<ChannelFolderItem>();
      for (let j = 0; j < items.length; j++) {
        itemList.Add(items[j]);
      }

      result.Add({ folder, items: itemList.ToArray() });
    }

    return result.ToArray();
  } finally {
    db.Dispose();
  }
};
