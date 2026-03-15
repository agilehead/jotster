import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Reaction, generateId } from "@jotster/core/Jotster.Core.js";

interface AddReactionInput {
  tenantId: long;
  messageId: long;
  userId: long;
  emojiName: string;
  emojiCode: string;
  reactionType: string;
}

export const addReaction = async (
  options: DbContextOptions,
  input: AddReactionInput
): Promise<Reaction> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const reaction = new Reaction();
  reaction.Id = generateId();
  reaction.TenantId = input.tenantId;
  reaction.MessageId = input.messageId;
  reaction.UserId = input.userId;
  reaction.EmojiName = input.emojiName;
  reaction.EmojiCode = input.emojiCode;
  reaction.ReactionType = input.reactionType;
  reaction.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Reactions.Add(reaction);
    await db.SaveChangesAsync();
    return reaction;
  } finally {
    db.Dispose();
  }
};
