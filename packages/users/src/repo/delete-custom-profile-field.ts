import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteCustomProfileField = async (
  options: DbContextOptions,
  tenantId: long,
  fieldId: long
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const fieldId0 = fieldId;

    const field = await db0.CustomProfileFields
      .Where((f) => f.Id === fieldId0).Where((f) => f.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (field === undefined) {
      return false;
    }

    // Delete all values associated with this field
    const values = await db0.CustomProfileFieldValues
      .Where((v) => v.FieldId === fieldId0).Where((v) => v.TenantId === tenantId0)
      .ToListAsync();

    for (let i = 0; i < values.Count; i++) {
      const value = values[i];
      db0.CustomProfileFieldValues.Remove(value);
    }

    db0.CustomProfileFields.Remove(field);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
