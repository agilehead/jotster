import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel } from "@jotster/core/Jotster.Core.js";

interface UpdateChannelInput {
  name?: string;
  description?: string;
  renderedDescription?: string;
  isPrivate?: int;
  isWebPublic?: int;
  historyPublicToSubscribers?: int;
  messageRetentionDays?: int;
}

export const updateChannel = async (
  options: DbContextOptions,
  channelId: long,
  updates: UpdateChannelInput
): Promise<Channel | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const channelId0 = channelId;
    const channel = await db0.Channels
      .Where((c) => c.Id === channelId0)
      .FirstOrDefaultAsync();

    if (channel === undefined) {
      return undefined;
    }

    if (updates.name !== undefined) {
      channel.Name = updates.name;
    }
    if (updates.description !== undefined) {
      channel.Description = updates.description;
    }
    if (updates.renderedDescription !== undefined) {
      channel.RenderedDescription = updates.renderedDescription;
    }
    if (updates.isPrivate !== undefined) {
      channel.IsPrivate = updates.isPrivate;
    }
    if (updates.isWebPublic !== undefined) {
      channel.IsWebPublic = updates.isWebPublic;
    }
    if (updates.historyPublicToSubscribers !== undefined) {
      channel.HistoryPublicToSubscribers = updates.historyPublicToSubscribers;
    }
    if (updates.messageRetentionDays !== undefined) {
      channel.MessageRetentionDays = updates.messageRetentionDays;
    }

    channel.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return channel;
  } finally {
    db.Dispose();
  }
};
