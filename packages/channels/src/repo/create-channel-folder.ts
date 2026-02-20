import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder, ChannelFolderItem, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateChannelFolderInput {
  tenantId: string;
  userId: string;
  name: string;
  channels?: string[];
}

export const createChannelFolder = async (
  options: DbContextOptions,
  input: CreateChannelFolderInput
): Promise<ChannelFolder> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const folder = new ChannelFolder();
  folder.Id = generateId();
  folder.TenantId = input.tenantId;
  folder.UserId = input.userId;
  folder.Name = input.name;
  folder.Ordering = 0 as int;
  folder.CreatedAt = now;
  folder.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.ChannelFolders.Add(folder);

    if (input.channels !== undefined) {
      for (let i = 0; i < input.channels.length; i++) {
        const item = new ChannelFolderItem();
        item.ChannelFolderId = folder.Id;
        item.ChannelId = input.channels[i];
        db.ChannelFolderItems.Add(item);
      }
    }

    await db.SaveChangesAsync();
    return folder;
  } finally {
    db.Dispose();
  }
};
