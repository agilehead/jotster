import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Presence } from "@jotster/core/Jotster.Core.js";

export const updatePresence = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  clientName: string,
  status: string,
  pingOnly?: boolean
): Promise<Presence> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const clientName0 = clientName;
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    const existing = await db0.Presences
      .Where((p) => p.UserId === userId0).Where((p) => p.ClientName === clientName0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      existing.Timestamp = now;
      if (pingOnly !== true) {
        existing.Status = status;
      }
      await db0.SaveChangesAsync();
      return existing;
    }

    const presence = new Presence();
    presence.UserId = userId;
    presence.TenantId = tenantId;
    presence.ClientName = clientName;
    presence.Status = status;
    presence.Timestamp = now;
    db0.Presences.Add(presence);
    await db0.SaveChangesAsync();
    return presence;
  } finally {
    db.Dispose();
  }
};
