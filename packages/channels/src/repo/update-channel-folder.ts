import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder, ChannelFolderItem } from "@jotster/core/Jotster.Core.js";

interface UpdateChannelFolderInput {
  name?: string;
  channels?: string[];
  ordering?: int;
}

export const updateChannelFolder = async (
  options: DbContextOptions,
  folderId: string,
  updates: UpdateChannelFolderInput
): Promise<ChannelFolder | undefined> => {
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

    if (updates.name !== undefined) {
      folder.Name = updates.name;
    }

    if (updates.ordering !== undefined) {
      folder.Ordering = updates.ordering;
    }

    if (updates.channels !== undefined) {
      // Remove existing items
      const existingItems = await db0.ChannelFolderItems
        .Where((item) => item.ChannelFolderId === folderId0)
        .ToListAsync();

      for (let i = 0; i < existingItems.Count; i++) {
        const existingItem = existingItems[i];
        db0.ChannelFolderItems.Remove(existingItem);
      }

      // Add new items
      for (let i = 0; i < updates.channels.length; i++) {
        const item = new ChannelFolderItem();
        item.ChannelFolderId = folderId;
        item.ChannelId = updates.channels[i];
        db0.ChannelFolderItems.Add(item);
      }
    }

    folder.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return folder;
  } finally {
    db.Dispose();
  }
};
