import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeMessageFlags = async (
  options: DbContextOptions,
  userId: long,
  messageIds: long[],
  flag: string,
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const flag0 = flag;

    for (let i = 0; i < messageIds.length; i++) {
      const messageId0 = messageIds[i];
      const existing = await db0.MessageFlags.Where((f) => f.UserId === userId0)
        .Where((f) => f.MessageId === messageId0)
        .Where((f) => f.Flag === flag0)
        .FirstOrDefaultAsync();

      if (existing !== undefined && existing !== null) {
        db0.MessageFlags.Remove(existing);
        await db0.SaveChangesAsync();
      }
    }
  } finally {
    db.Dispose();
  }
};
