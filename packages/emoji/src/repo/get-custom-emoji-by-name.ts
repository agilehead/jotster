import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomEmoji } from "@jotster/core/Jotster.Core.js";

export async function getCustomEmojiByName(
  options: DbContextOptions,
  tenantId: string,
  name: string
): Promise<CustomEmoji | undefined> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const name0 = name;
    const activeStatus = 1 as int;
    const result = await db0.CustomEmojis
      .Where(
        (e) => e.TenantId === tenantId0 && e.Name === name0 && e.IsActive === activeStatus
      )
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
}
