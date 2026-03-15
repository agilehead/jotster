import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserStatus } from "@jotster/core/Jotster.Core.js";

export const setUserStatus = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  statusText: string,
  emojiName?: string,
  emojiCode?: string,
  reactionType?: string
): Promise<UserStatus> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    const existing = await db0.UserStatuses
      .Where((s) => s.UserId === userId0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      existing.StatusText = statusText;
      existing.EmojiName = emojiName;
      existing.EmojiCode = emojiCode;
      existing.ReactionType = reactionType;
      existing.UpdatedAt = now;
      await db0.SaveChangesAsync();
      return existing;
    }

    const userStatus = new UserStatus();
    userStatus.UserId = userId;
    userStatus.TenantId = tenantId;
    userStatus.StatusText = statusText;
    userStatus.EmojiName = emojiName;
    userStatus.EmojiCode = emojiCode;
    userStatus.ReactionType = reactionType;
    userStatus.UpdatedAt = now;
    db0.UserStatuses.Add(userStatus);
    await db0.SaveChangesAsync();
    return userStatus;
  } finally {
    db.Dispose();
  }
};
