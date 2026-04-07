import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  TenantUserSettingDefault,
} from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

export const updateUserSettingDefaults = async (
  options: DbContextOptions,
  tenantId: long,
  updates: Record<string, JsValue>,
): Promise<Record<string, JsValue>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const record = await db0.TenantUserSettingDefaults.Where(
      (x) => x.TenantId === tenantId0,
    ).FirstOrDefaultAsync();

    if (record != null) {
      // Merge into existing settings
      let existing: Record<string, JsValue> = {};
      if (record.SettingsJson.length > 0) {
        const parsed = JsonSerializer.Deserialize<Record<string, JsValue>>(
          record.SettingsJson,
        );
        if (parsed != null) {
          existing = parsed;
        }
      }

      const updateKeys = Object.keys(updates);
      for (let i = 0; i < updateKeys.length; i++) {
        const key = updateKeys[i]!;
        existing[key] = updates[key];
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
