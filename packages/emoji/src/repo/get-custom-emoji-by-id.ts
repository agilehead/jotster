import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomEmoji } from "@jotster/core/Jotster.Core.js";

export const getCustomEmojiById = async (
  options: DbContextOptions,
  tenantId: string,
  emojiId: string,
): Promise<CustomEmoji | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const item = await db.CustomEmojis
      .Where((x) => x.TenantId === tenantId)
      .Where((x) => x.Id === emojiId)
      .Where((x) => x.IsActive === 1)
      .FirstOrDefaultAsync();
    return item ?? undefined;
  } finally {
    db.Dispose();
  }
};
