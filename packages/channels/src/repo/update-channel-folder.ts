import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder } from "@jotster/core/Jotster.Core.js";

interface UpdateChannelFolderInput {
  name?: string;
  description?: string;
  isArchived?: int;
}

export const updateChannelFolder = async (
  options: DbContextOptions,
  folderId: long,
  updates: UpdateChannelFolderInput,
): Promise<ChannelFolder | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const folderId0 = folderId;

    const folder = await db0.ChannelFolders.Where(
      (f) => f.Id === folderId0,
    ).FirstOrDefaultAsync();

    if (folder == null) {
      return undefined;
    }

    if (updates.name !== undefined) {
      folder.Name = updates.name;
    }

    if (updates.description !== undefined) {
      folder.Description = updates.description;
    }

    if (updates.isArchived !== undefined) {
      folder.IsArchived = updates.isArchived;
    }

    folder.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return folder;
  } finally {
    db.Dispose();
  }
};
