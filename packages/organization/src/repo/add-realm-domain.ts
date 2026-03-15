import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, RealmDomain, generateId } from "@jotster/core/Jotster.Core.js";

export const addRealmDomain = async (
  options: DbContextOptions,
  tenantId: long,
  domain: string,
  allowSubdomains: int
): Promise<RealmDomain | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const domain0 = domain;

    // Check uniqueness
    const existing = await db0.RealmDomains
      .Where((x) => x.TenantId === tenantId0).Where((x) => x.Domain === domain0)
      .FirstOrDefaultAsync();

    if (existing !== undefined) {
      return undefined;
    }

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    const realmDomain = new RealmDomain();
    realmDomain.Id = generateId();
    realmDomain.TenantId = tenantId;
    realmDomain.Domain = domain;
    realmDomain.AllowSubdomains = allowSubdomains;
    realmDomain.CreatedAt = now;

    db.RealmDomains.Add(realmDomain);
    await db.SaveChangesAsync();
    return realmDomain;
  } finally {
    db.Dispose();
  }
};
