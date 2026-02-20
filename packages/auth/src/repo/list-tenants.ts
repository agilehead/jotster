import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant } from "@jotster/core/Jotster.Core.js";

export const listTenants = async (
  options: DbContextOptions
): Promise<Tenant[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const result = await db0.Tenants.ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
