import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getExportConsents = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<Record<string, JsValue>[]> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const users = await db.Users.Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.IsActive === 1)
      .Where((entry) => entry.IsBot === 0)
      .OrderBy((entry) => entry.Email)
      .ToListAsync();

    const result = new List<Record<string, JsValue>>();
    for (let i = 0; i < users.Count; i++) {
      const user = users[i];
      const userId0 = user.Id;
      const setting = await db.UserSettings.Where(
        (entry) => entry.UserId === userId0,
      ).FirstOrDefaultAsync();

      const entry: Record<string, JsValue> = {};
      entry.user_id = user.Id;
      entry.consented = setting?.AllowPrivateDataExport === 1;
      entry.email_address_visibility = setting?.EmailAddressVisibility ?? 1;
      result.Add(entry);
    }

    return result.ToArray();
  } finally {
    db.Dispose();
  }
};
