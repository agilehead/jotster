import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export const getUserByEmail = async (
  options: DbContextOptions,
  tenantId: string,
  email: string
): Promise<User | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const email0 = email;
    const byTenant = await db0.Users.Where((u) => u.TenantId === tenantId0).ToArrayAsync();
    let result: User | undefined = undefined;
    for (let i = 0; i < byTenant.Length; i++) {
      if (byTenant[i].Email === email0) {
        result = byTenant[i];
        break;
      }
    }
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
