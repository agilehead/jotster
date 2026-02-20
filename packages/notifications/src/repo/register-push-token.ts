import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, PushDeviceToken, generateId } from "@jotster/core/Jotster.Core.js";

export const registerPushToken = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  kind: string,
  token: string,
  iosAppId: string | undefined
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    // Check if a record with same (TenantId, UserId, Token) exists
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const token0 = token;
    const existing = await db0.PushDeviceTokens
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.UserId === userId0).Where((x) => x.Token === token0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      // Update existing record
      existing.Kind = kind;
      existing.IosAppId = iosAppId;
    } else {
      // Insert new record
      const entity = new PushDeviceToken();
      entity.Id = generateId();
      entity.TenantId = tenantId;
      entity.UserId = userId;
      entity.Kind = kind;
      entity.Token = token;
      entity.IosAppId = iosAppId;
      entity.CreatedAt = now;
      db.PushDeviceTokens.Add(entity);
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
