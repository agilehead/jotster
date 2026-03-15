import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deactivateUser = async (
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

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    user.IsActive = 0 as int;
    user.UpdatedAt = now;

    // Revoke all active API keys for this user
    const keys = await db0.ApiKeys.Where((k) => k.TenantId === tenantId0)
      .Where((k) => k.UserId === userId0)
      .Where((k) => k.RevokedAt === undefined)
      .ToListAsync();

    for (let i = 0; i < keys.Count; i++) {
      const key = keys[i];
      key.RevokedAt = now;
    }

    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
