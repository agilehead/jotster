import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeRealmDomain = async (
  options: DbContextOptions,
  tenantId: long,
  domain: string
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const domain0 = domain;

    const realmDomain = await db0.RealmDomains
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.Domain === domain0)
      .FirstOrDefaultAsync();

    if (realmDomain === undefined) {
      return false;
    }

    db.RealmDomains.Remove(realmDomain);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
