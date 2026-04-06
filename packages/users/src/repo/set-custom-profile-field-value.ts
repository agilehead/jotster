import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  CustomProfileFieldValue,
  generateId,
} from "@jotster/core/Jotster.Core.js";

export const setCustomProfileFieldValue = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  fieldId: long,
  value: string,
  renderedValue?: string,
): Promise<CustomProfileFieldValue> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const fieldId0 = fieldId;

    const existing = await db0.CustomProfileFieldValues.Where(
      (v) => v.TenantId === tenantId0,
    )
      .Where((v) => v.UserId === userId0)
      .Where((v) => v.FieldId === fieldId0)
      .FirstOrDefaultAsync();

    if (existing != null) {
      existing.Value = value;
      existing.RenderedValue = renderedValue;
      await db0.SaveChangesAsync();
      return existing;
    }

    const entry = new CustomProfileFieldValue();
    entry.Id = generateId();
    entry.TenantId = tenantId;
    entry.UserId = userId;
    entry.FieldId = fieldId;
    entry.Value = value;
    entry.RenderedValue = renderedValue;

    db0.CustomProfileFieldValues.Add(entry);
    await db0.SaveChangesAsync();
    return entry;
  } finally {
    db.Dispose();
  }
};
