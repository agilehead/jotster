import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomProfileField } from "@jotster/core/Jotster.Core.js";

export async function getCustomProfileFields(
  options: DbContextOptions,
  tenantId: string
): Promise<CustomProfileField[]> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.CustomProfileFields
      .Where((f) => f.TenantId === tenantId0)
      .OrderBy((f) => f.Ordering)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
}
