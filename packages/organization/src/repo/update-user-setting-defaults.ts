import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, TenantUserSettingDefault } from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

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
      let existing: Record<string, unknown> = {};
      if (record.SettingsJson.length > 0) {
        const parsed = JsonSerializer.Deserialize<Record<string, unknown>>(record.SettingsJson);
        if (parsed !== undefined) {
          existing = parsed;
        }
      }

      const updateKeys = updates.Keys;
      for (let i = 0; i < updateKeys.length; i++) {
        existing[updateKeys[i]] = updates[updateKeys[i]];
      }

      record.SettingsJson = JsonSerializer.Serialize(existing);
      await db.SaveChangesAsync();
      return existing;
    } else {
      // Create new record
      const newRecord = new TenantUserSettingDefault();
      newRecord.TenantId = tenantId;
      newRecord.SettingsJson = JsonSerializer.Serialize(updates);

      db.TenantUserSettingDefaults.Add(newRecord);
      await db.SaveChangesAsync();
      return updates;
    }
  } finally {
    db.Dispose();
  }
};
