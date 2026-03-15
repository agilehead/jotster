import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DmGroup, DmGroupMember, generateId } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const findOrCreateDmGroup = async (
  options: DbContextOptions,
  tenantId: long,
  userIds: long[]
): Promise<DmGroup> => {
  // Sort userIds and create hash
  const sorted = new List<long>();
  for (let i = 0; i < userIds.length; i++) {
    sorted.Add(userIds[i]);
  }
  sorted.Sort();
  const sortedArr = sorted.ToArray();
  let groupHash = "";
  for (let i = 0; i < sortedArr.length; i++) {
    if (i > 0) { groupHash = groupHash + ","; }
    groupHash = groupHash + sortedArr[i].toString();
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const groupHash0 = groupHash;

    // Look up by TenantId + GroupHash
    const existing = await db0.DmGroups
      .Where((g) => g.TenantId === tenantId0).Where((g) => g.GroupHash === groupHash0)
      .FirstOrDefaultAsync();

    if (existing !== undefined && existing !== null) {
      return existing;
    }

    // Create new DmGroup
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    const group = new DmGroup();
    group.Id = generateId();
    group.TenantId = tenantId;
    group.GroupHash = groupHash;
    group.CreatedAt = now;

    db0.DmGroups.Add(group);

    // Create DmGroupMember rows for each userId
    for (let i = 0; i < sortedArr.length; i++) {
      const member = new DmGroupMember();
      member.DmGroupId = group.Id;
      member.UserId = sortedArr[i];
      db0.DmGroupMembers.Add(member);
    }

    await db0.SaveChangesAsync();
    return group;
  } finally {
    db.Dispose();
  }
};
