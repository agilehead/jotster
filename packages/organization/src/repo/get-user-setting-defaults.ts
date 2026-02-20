import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const getUserSettingDefaults = async (
  options: DbContextOptions,
  tenantId: string
): Promise<Record<string, unknown>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const record = await db0.TenantUserSettingDefaults
      .Where((x) => x.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (record === undefined) {
      return {};
    }

    if (record.SettingsJson.Length === 0) {
      return {};
    }

    return JSON.parse(record.SettingsJson) as Record<string, unknown>;
  } finally {
    db.Dispose();
  }
};
