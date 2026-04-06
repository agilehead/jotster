import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deactivateUserGroup = async (
  options: DbContextOptions,
  groupId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;
    const group = await db0.UserGroups.Where(
      (g) => g.Id === groupId0,
    ).FirstOrDefaultAsync();

    if (group == null) {
      return false;
    }

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    group.IsActive = 0 as int;
    group.UpdatedAt = now;

    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
