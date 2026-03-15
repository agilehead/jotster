import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant } from "@jotster/core/Jotster.Core.js";

export async function listTenants(
  options: DbContextOptions,
): Promise<Tenant[]> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const result = await db0.Tenants.OrderBy(
      (tenant) => tenant.CreatedAt,
    ).ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
}
