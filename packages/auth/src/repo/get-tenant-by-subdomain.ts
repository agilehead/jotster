import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant } from "@jotster/core/Jotster.Core.js";

export const getTenantBySubdomain = async (
  options: DbContextOptions,
  subdomain: string,
): Promise<Tenant | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const subdomain0 = subdomain;
    const result = await db0.Tenants.Where(
      (t) => t.Subdomain === subdomain0,
    ).FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
