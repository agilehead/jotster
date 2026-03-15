import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeReaction = async (
  options: DbContextOptions,
  tenantId: long,
  messageId: long,
  userId: long,
  emojiCode: string,
  reactionType: string
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const userId0 = userId;
    const emojiCode0 = emojiCode;
    const reactionType0 = reactionType;

    const reaction = await db0.Reactions
      .Where((r) => r.TenantId === tenantId0).Where((r) => r.MessageId === messageId0).Where((r) => r.UserId === userId0).Where((r) => r.EmojiCode === emojiCode0).Where((r) => r.ReactionType === reactionType0)
      .FirstOrDefaultAsync();

    if (reaction === undefined || reaction === null) {
      return false;
    }

    db0.Reactions.Remove(reaction);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
