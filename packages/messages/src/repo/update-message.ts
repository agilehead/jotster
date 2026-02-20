import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Message } from "@jotster/core/Jotster.Core.js";

interface UpdateMessageInput {
  content?: string;
  renderedContent?: string;
  topic?: string;
  channelId?: string;
}

export const updateMessage = async (
  options: DbContextOptions,
  tenantId: string,
  messageId: string,
  updates: UpdateMessageInput
): Promise<Message | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const message = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id === messageId0)
      .FirstOrDefaultAsync();

    if (message === undefined || message === null) {
      return undefined;
    }

    if (updates.content !== undefined) {
      message.Content = updates.content;
    }
    if (updates.renderedContent !== undefined) {
      message.RenderedContent = updates.renderedContent;
    }
    if (updates.topic !== undefined) {
      message.Topic = updates.topic;
    }
    if (updates.channelId !== undefined) {
      message.ChannelId = updates.channelId;
    }

    message.EditedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return message;
  } finally {
    db.Dispose();
  }
};
