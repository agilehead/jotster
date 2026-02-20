import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateChannelInput {
  tenantId: string;
  name: string;
  description?: string;
  isPrivate?: int;
  isWebPublic?: int;
  historyPublicToSubscribers?: int;
  creatorId?: string;
  messageRetentionDays?: int;
}

export const createChannel = async (
  options: DbContextOptions,
  input: CreateChannelInput
): Promise<Channel> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const channel = new Channel();
  channel.Id = generateId();
  channel.TenantId = input.tenantId;
  channel.Name = input.name;
  channel.Description = input.description ?? "";
  channel.RenderedDescription = "";
  channel.IsPrivate = (input.isPrivate ?? 0) as int;
  channel.IsWebPublic = (input.isWebPublic ?? 0) as int;
  channel.HistoryPublicToSubscribers = (input.historyPublicToSubscribers ?? 1) as int;
  channel.CreatorId = input.creatorId;
  channel.MessageRetentionDays = input.messageRetentionDays;
  channel.IsArchived = 0 as int;
  channel.CreatedAt = now;
  channel.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Channels.Add(channel);
    await db.SaveChangesAsync();
    return channel;
  } finally {
    db.Dispose();
  }
};
