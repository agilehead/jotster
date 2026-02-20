import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, RealmDomain } from "@jotster/core/Jotster.Core.js";

export const updateRealmDomain = async (
  options: DbContextOptions,
  tenantId: string,
  domain: string,
  allowSubdomains: int
): Promise<RealmDomain | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const domain0 = domain;

    const realmDomain = await db0.RealmDomains
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.Domain === domain0)
      .FirstOrDefaultAsync();

    if (realmDomain === undefined) {
      return undefined;
    }

    realmDomain.AllowSubdomains = allowSubdomains;
    await db.SaveChangesAsync();
    return realmDomain;
  } finally {
    db.Dispose();
  }
};
