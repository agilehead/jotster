import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DefaultChannel, generateId } from "@jotster/core/Jotster.Core.js";

export const addDefaultChannel = async (
  options: DbContextOptions,
  tenantId: string,
  channelId: string
): Promise<DefaultChannel> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const defaultChannel = new DefaultChannel();
  defaultChannel.Id = generateId();
  defaultChannel.TenantId = tenantId;
  defaultChannel.ChannelId = channelId;
  defaultChannel.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.DefaultChannels.Add(defaultChannel);
    await db.SaveChangesAsync();
    return defaultChannel;
  } finally {
    db.Dispose();
  }
};
