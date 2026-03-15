import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  ChannelFolder,
  ChannelFolderItem,
} from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

interface ChannelFolderWithItems {
  folder: ChannelFolder;
  items: ChannelFolderItem[];
}

export const getChannelFolders = async (
  options: DbContextOptions,
  tenantId: long,
  includeArchived: boolean,
): Promise<ChannelFolderWithItems[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const includeArchived0 = includeArchived;

    const folders = await db0.ChannelFolders.Where(
      (f) => f.TenantId === tenantId0,
    )
      .Where((f) => includeArchived0 || f.IsArchived === 0)
      .OrderBy((f) => f.Ordering)
      .ToListAsync();

    const result = new List<ChannelFolderWithItems>();
    for (let i = 0; i < folders.Count; i++) {
      const folder = folders[i];
      const folderId0 = folder.Id;
      const items = await db0.ChannelFolderItems.Where(
        (item) => item.ChannelFolderId === folderId0,
      ).ToListAsync();

      const itemList = new List<ChannelFolderItem>();
      for (let j = 0; j < items.Count; j++) {
        const item = items[j];
        itemList.Add(item);
      }

      result.Add({ folder, items: itemList.ToArray() });
    }

    return result.ToArray();
  } finally {
    db.Dispose();
  }
};
