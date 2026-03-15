import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomEmoji } from "@jotster/core/Jotster.Core.js";

export const getCustomEmojiById = async (
  options: DbContextOptions,
  tenantId: long,
  emojiId: long,
): Promise<CustomEmoji | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const emojiId0 = emojiId;
    const activeStatus = 1 as int;
    const item = await db0.CustomEmojis.Where((x) => x.TenantId === tenantId0)
      .Where((x) => x.Id === emojiId0)
      .Where((x) => x.IsActive === activeStatus)
      .FirstOrDefaultAsync();
    return item ?? undefined;
  } finally {
    db.Dispose();
  }
};
