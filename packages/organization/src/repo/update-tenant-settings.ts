import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant } from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

export const updateTenantSettings = async (
  options: DbContextOptions,
  tenantId: string,
  settings: Record<string, unknown>
): Promise<Tenant | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const tenant = await db0.Tenants
      .Where((x) => x.Id === tenantId0)
      .FirstOrDefaultAsync();

    if (tenant === undefined) {
      return undefined;
    }

    // Parse existing settings
    let existingSettings: Record<string, unknown> = {};
    if (tenant.SettingsJson.length > 0) {
      const parsed = JsonSerializer.Deserialize<Record<string, unknown>>(tenant.SettingsJson);
      if (parsed !== undefined) {
        existingSettings = parsed;
      }
    }

    // Merge new settings into existing
    const settingsKeys = settings.Keys;
    for (let i = 0; i < settingsKeys.length; i++) {
      const key = settingsKeys[i];
      existingSettings[key] = settings[key];

      // Update direct columns for specific properties
      if (key === "name" && typeof settings[key] === "string") {
        tenant.Name = settings[key] as string;
      }
      if (key === "description" && typeof settings[key] === "string") {
        tenant.Description = settings[key] as string;
      }
      if (key === "icon_url") {
        tenant.IconUrl = settings[key] as string | undefined;
      }
      if (key === "logo_url") {
        tenant.LogoUrl = settings[key] as string | undefined;
      }
    }

    tenant.SettingsJson = JsonSerializer.Serialize(existingSettings);
    tenant.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    await db.SaveChangesAsync();
    return tenant;
  } finally {
    db.Dispose();
  }
};
