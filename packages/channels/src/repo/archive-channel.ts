import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const archiveChannel = async (
  options: DbContextOptions,
  channelId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const channelId0 = channelId;
    const channel = await db0.Channels.Where(
      (c) => c.Id === channelId0,
    ).FirstOrDefaultAsync();

    if (channel === undefined) {
      return false;
    }

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    channel.IsArchived = 1 as int;
    channel.UpdatedAt = now;

    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
