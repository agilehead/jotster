import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

export const getUserSettingDefaults = async (
  options: DbContextOptions,
  tenantId: long
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

    if (record.SettingsJson.length === 0) {
      return {};
    }

    const deserialized = JsonSerializer.Deserialize<Record<string, unknown>>(record.SettingsJson);
    if (deserialized === undefined) {
      return {};
    }
    return deserialized;
  } finally {
    db.Dispose();
  }
};
