import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, MessageFlag } from "@jotster/core/Jotster.Core.js";

export const addMessageFlags = async (
  options: DbContextOptions,
  userId: long,
  messageIds: long[],
  flag: string,
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    for (let i = 0; i < messageIds.length; i++) {
      const messageFlag = new MessageFlag();
      messageFlag.UserId = userId;
      messageFlag.MessageId = messageIds[i];
      messageFlag.Flag = flag;

      try {
        db.MessageFlags.Add(messageFlag);
        await db.SaveChangesAsync();
      } catch (_e) {
        // Ignore duplicate PK violations - flag already exists
      }
    }
  } finally {
    db.Dispose();
  }
};
