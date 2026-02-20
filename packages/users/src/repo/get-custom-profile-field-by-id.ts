import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomProfileField } from "@jotster/core/Jotster.Core.js";

export async function getCustomProfileFieldById(
  options: DbContextOptions,
  tenantId: string,
  fieldId: string
): Promise<CustomProfileField | undefined> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const fieldId0 = fieldId;
    const result = await db0.CustomProfileFields
      .Where((f) => f.Id === fieldId0).Where((f) => f.TenantId === tenantId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
}
