import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export async function getUserByEmail(
  options: DbContextOptions,
  tenantId: long,
  email: string,
): Promise<User | undefined> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const email0 = email;
    const result = await db0.Users.Where(
      (u) => u.TenantId === tenantId0 && u.Email === email0,
    ).FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
}
