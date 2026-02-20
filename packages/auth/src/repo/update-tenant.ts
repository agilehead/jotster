import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant } from "@jotster/core/Jotster.Core.js";

export const updateTenant = async (
  options: DbContextOptions,
  tenantId: string,
  updates: { name?: string; description?: string; active?: int }
): Promise<Tenant | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const tenant = await db0.Tenants.Where((t) => t.Id === tenantId0).FirstOrDefaultAsync();
    if (tenant === undefined) return undefined;
    if (updates.name !== undefined) {
      tenant.Name = updates.name;
    }
    if (updates.description !== undefined) {
      tenant.Description = updates.description;
    }
    if (updates.active !== undefined) {
      tenant.Active = updates.active;
    }
    tenant.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    await db0.SaveChangesAsync();
    return tenant;
  } finally {
    db.Dispose();
  }
};
