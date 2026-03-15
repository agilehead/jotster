import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ChannelFolder } from "@jotster/core/Jotster.Core.js";

interface CreateChannelFolderInput {
  tenantId: long;
  userId: long;
  name: string;
  description: string;
}

export const createChannelFolder = async (
  options: DbContextOptions,
  input: CreateChannelFolderInput,
): Promise<ChannelFolder> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const folder = new ChannelFolder();
  folder.TenantId = input.tenantId;
  folder.UserId = input.userId;
  folder.Name = input.name;
  folder.Description = input.description;
  folder.IsArchived = 0 as int;
  folder.Ordering = 0 as int;
  folder.CreatedAt = now;
  folder.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.ChannelFolders.Add(folder);

    await db.SaveChangesAsync();
    return folder;
  } finally {
    db.Dispose();
  }
};
