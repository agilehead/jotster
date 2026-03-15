import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const reactivateUser = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const user = await db0.Users.Where((u) => u.Id === userId0)
      .Where((u) => u.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (user === undefined) {
      return false;
    }

    user.IsActive = 1 as int;
    user.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
