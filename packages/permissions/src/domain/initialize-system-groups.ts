import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserGroup } from "@jotster/core/Jotster.Core.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";

const SYSTEM_GROUP_NAMES: string[] = [
  "role:everyone",
  "role:members",
  "role:fullmembers",
  "role:moderators",
  "role:administrators",
  "role:owners",
  "role:internet",
  "role:nobody",
];

export const initializeSystemGroups = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<Result<boolean, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const one = 1 as int;

    // Fetch existing system groups for this tenant
    const existing = await db0.UserGroups.Where((g) => g.TenantId === tenantId0)
      .Where((g) => g.IsSystemGroup === one)
      .ToListAsync();

    // Build a set of existing group names
    const existingNames: Record<string, boolean> = {};
    for (let i = 0; i < existing.Count; i++) {
      const group = existing[i];
      existingNames[group.Name] = true;
    }

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    let created = false;

    for (let i = 0; i < SYSTEM_GROUP_NAMES.length; i++) {
      const name = SYSTEM_GROUP_NAMES[i];
      if (existingNames[name] === true) {
        continue;
      }

      const group = new UserGroup();
      group.TenantId = tenantId;
      group.Name = name;
      group.Description = "";
      group.IsSystemGroup = 1 as int;
      group.IsActive = 1 as int;
      group.CreatedAt = now;
      group.UpdatedAt = now;

      db.UserGroups.Add(group);
      created = true;
    }

    if (created) {
      await db.SaveChangesAsync();
    }

    return ok(true);
  } finally {
    db.Dispose();
  }
};
