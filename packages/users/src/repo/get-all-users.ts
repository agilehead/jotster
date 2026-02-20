import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export async function getAllUsers(
  options: DbContextOptions,
  tenantId: string
): Promise<User[]> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.Users.Where((u) => u.TenantId === tenantId0).ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
}
