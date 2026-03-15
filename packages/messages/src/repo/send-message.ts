import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Message } from "@jotster/core/Jotster.Core.js";

interface SendMessageInput {
  tenantId: long;
  senderId: long;
  type: string;
  channelId?: long;
  topic?: string;
  dmGroupId?: string;
  content: string;
  renderedContent: string;
  hasAttachment?: int;
  hasImage?: int;
  hasLink?: int;
}

export const sendMessage = async (
  options: DbContextOptions,
  input: SendMessageInput,
): Promise<Message> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const message = new Message();
  message.TenantId = input.tenantId;
  message.SenderId = input.senderId;
  message.Type = input.type;
  message.ChannelId = input.channelId;
  message.Topic = input.topic;
  message.DmGroupId = input.dmGroupId;
  message.Content = input.content;
  message.RenderedContent = input.renderedContent;
  message.HasAttachment = (input.hasAttachment ?? 0) as int;
  message.HasImage = (input.hasImage ?? 0) as int;
  message.HasLink = (input.hasLink ?? 0) as int;
  message.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Messages.Add(message);
    await db.SaveChangesAsync();
    return message;
  } finally {
    db.Dispose();
  }
};
