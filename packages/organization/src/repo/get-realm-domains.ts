import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, RealmDomain } from "@jotster/core/Jotster.Core.js";

export const getRealmDomains = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<RealmDomain[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.RealmDomains.Where((x) => x.TenantId === tenantId0)
      .OrderBy((x) => x.Domain)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
