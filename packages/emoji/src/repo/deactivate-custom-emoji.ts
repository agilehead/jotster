import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deactivateCustomEmoji = async (
  options: DbContextOptions,
  tenantId: long,
  name: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const name0 = name;
    const activeStatus = 1 as int;
    const emoji = await db0.CustomEmojis.Where(
      (e) =>
        e.TenantId === tenantId0 &&
        e.Name === name0 &&
        e.IsActive === activeStatus,
    ).FirstOrDefaultAsync();

    if (emoji === undefined) {
      return false;
    }

    emoji.IsActive = 0 as int;

    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
