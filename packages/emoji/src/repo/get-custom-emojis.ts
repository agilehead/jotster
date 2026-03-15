import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomEmoji } from "@jotster/core/Jotster.Core.js";

export async function getCustomEmojis(
  options: DbContextOptions,
  tenantId: long
): Promise<CustomEmoji[]> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const activeStatus = 1 as int;
    const result = await db0.CustomEmojis
      .Where((e) => e.TenantId === tenantId0).Where((e) => e.IsActive === activeStatus)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
}
