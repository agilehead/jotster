import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export async function revokeAllApiKeys(
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<void> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const keys = await db0.ApiKeys
      .Where((k) => k.TenantId === tenantId0).Where((k) => k.UserId === userId0).Where((k) => k.RevokedAt === undefined)
      .ToListAsync();
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    for (let i = 0; i < keys.Count; i++) {
      const key = keys[i];
      key.RevokedAt = now;
    }
    await db0.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
}
