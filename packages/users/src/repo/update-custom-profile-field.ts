import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomProfileField } from "@jotster/core/Jotster.Core.js";

export const updateCustomProfileField = async (
  options: DbContextOptions,
  tenantId: string,
  fieldId: string,
  updates: { name?: string; hint?: string; fieldType?: int; fieldDataJson?: string; displayInProfileSummary?: int; ordering?: int }
): Promise<CustomProfileField | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const fieldId0 = fieldId;
    const field = await db0.CustomProfileFields
      .Where((f) => f.Id === fieldId0).Where((f) => f.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (field === undefined) {
      return undefined;
    }

    if (updates.name !== undefined) {
      field.Name = updates.name;
    }
    if (updates.hint !== undefined) {
      field.Hint = updates.hint;
    }
    if (updates.fieldType !== undefined) {
      field.FieldType = updates.fieldType;
    }
    if (updates.fieldDataJson !== undefined) {
      field.FieldDataJson = updates.fieldDataJson;
    }
    if (updates.displayInProfileSummary !== undefined) {
      field.DisplayInProfileSummary = updates.displayInProfileSummary;
    }
    if (updates.ordering !== undefined) {
      field.Ordering = updates.ordering;
    }

    await db0.SaveChangesAsync();
    return field;
  } finally {
    db.Dispose();
  }
};
