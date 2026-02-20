import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, TenantUserSettingDefault } from "@jotster/core/Jotster.Core.js";

export const updateUserSettingDefaults = async (
  options: DbContextOptions,
  tenantId: string,
  updates: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const record = await db0.TenantUserSettingDefaults
      .Where((x) => x.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (record !== undefined) {
      // Merge into existing settings
      const existing: Record<string, unknown> = record.SettingsJson.Length > 0
        ? JSON.parse(record.SettingsJson) as Record<string, unknown>
        : {};

      const keys = Object.keys(updates);
      for (let i = 0; i < keys.length; i++) {
        existing[keys[i]] = updates[keys[i]];
      }

      record.SettingsJson = JSON.stringify(existing);
      await db.SaveChangesAsync();
      return existing;
    } else {
      // Create new record
      const newRecord = new TenantUserSettingDefault();
      newRecord.TenantId = tenantId;
      newRecord.SettingsJson = JSON.stringify(updates);

      db.TenantUserSettingDefaults.Add(newRecord);
      await db.SaveChangesAsync();
      return updates;
    }
  } finally {
    db.Dispose();
  }
};
