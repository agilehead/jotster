import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const revokeAllApiKeys = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const keys = await db0.ApiKeys
      .Where((k) => k.TenantId === tenantId0).Where((k) => k.UserId === userId0).Where((k) => k.RevokedAt === undefined)
      .ToArrayAsync();
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    for (let i = 0; i < keys.Length; i++) {
      keys[i].RevokedAt = now;
    }
    await db0.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
