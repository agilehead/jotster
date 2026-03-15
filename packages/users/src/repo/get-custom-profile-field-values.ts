import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  CustomProfileFieldValue,
} from "@jotster/core/Jotster.Core.js";

export async function getCustomProfileFieldValues(
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<CustomProfileFieldValue[]> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.CustomProfileFieldValues.Where(
      (v) => v.TenantId === tenantId0,
    )
      .Where((v) => v.UserId === userId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
}
