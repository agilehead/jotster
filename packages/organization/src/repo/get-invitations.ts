import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Invitation } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getInvitations = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<Invitation[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const status0 = "pending";
    const now0 = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    const result = await db0.Invitations.Where((x) => x.TenantId === tenantId0)
      .Where((x) => x.Status === status0)
      .OrderByDescending((x) => x.CreatedAt)
      .ToListAsync();

    // Filter out expired invitations in application code
    const filtered = new List<Invitation>();
    for (let i = 0; i < result.Count; i++) {
      const inv = result[i];
      if (inv.ExpiresAt === undefined || inv.ExpiresAt > now0) {
        filtered.Add(inv);
      }
    }

    return filtered.ToArray();
  } finally {
    db.Dispose();
  }
};
