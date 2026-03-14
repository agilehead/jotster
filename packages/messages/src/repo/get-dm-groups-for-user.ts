import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DmGroup } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getDmGroupsForUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<DmGroup[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;

    // Get all DmGroupMember rows for this user
    const memberships = await db0.DmGroupMembers
      .Where((m) => m.UserId === userId0)
      .ToListAsync();

    const groups = new List<DmGroup>();
    for (let i = 0; i < memberships.Count; i++) {
      const membership = memberships[i];
      const dmGroupId0 = membership.DmGroupId;
      const group = await db0.DmGroups
        .Where((g) => g.Id === dmGroupId0).Where((g) => g.TenantId === tenantId0)
        .FirstOrDefaultAsync();

      if (group !== undefined && group !== null) {
        groups.Add(group);
      }
    }
    return groups.ToArray();
  } finally {
    db.Dispose();
  }
};
