import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, MessageEditHistory, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateEditHistoryInput {
  messageId: string;
  userId: string;
  prevContent?: string;
  prevRenderedContent?: string;
  prevTopic?: string;
  prevChannelId?: string;
}

export const createEditHistory = async (
  options: DbContextOptions,
  input: CreateEditHistoryInput
): Promise<MessageEditHistory> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const entry = new MessageEditHistory();
  entry.Id = generateId();
  entry.MessageId = input.messageId;
  entry.UserId = input.userId;
  entry.PrevContent = input.prevContent;
  entry.PrevRenderedContent = input.prevRenderedContent;
  entry.PrevTopic = input.prevTopic;
  entry.PrevChannelId = input.prevChannelId;
  entry.Timestamp = now;

  const db = new JotsterDbContext(options);
  try {
    db.MessageEditHistories.Add(entry);
    await db.SaveChangesAsync();
    return entry;
  } finally {
    db.Dispose();
  }
};
