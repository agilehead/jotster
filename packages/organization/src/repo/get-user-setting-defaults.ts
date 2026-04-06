import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const getUserSettingDefaults = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<Record<string, JsValue>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const record = await db0.TenantUserSettingDefaults.Where(
      (x) => x.TenantId === tenantId0,
    ).FirstOrDefaultAsync();

    if (record == null) {
      return {};
    }

    if (record.SettingsJson.length === 0) {
      return {};
    }

    const parsed: JsValue = JSON.parse(record.SettingsJson);
    if (
      parsed == null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed as Record<string, JsValue>;
  } finally {
    db.Dispose();
  }
};
