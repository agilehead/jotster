import type { int } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";

export const isUserInGroup = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  groupId: string
): Promise<Result<boolean, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const groupId0 = groupId;

    const group = await db0.UserGroups
      .Where((g) => g.Id === groupId0)
      .FirstOrDefaultAsync();

    if (group === undefined) {
      return err("Group not found");
    }

    const one = 1 as int;
    const zero = 0 as int;

    if (group.IsSystemGroup === one) {
      const tenantId0 = tenantId;
      const userId0 = userId;

      const user = await db0.Users
        .Where((u) => u.Id === userId0).Where((u) => u.TenantId === tenantId0)
        .FirstOrDefaultAsync();

      if (user === undefined) {
        return ok(false);
      }

      if (user.IsActive !== one) {
        return ok(false);
      }

      const groupName = group.Name;

      if (groupName === "role:everyone") {
        return ok(true);
      }

      if (groupName === "role:members") {
        const memberThreshold = 400 as int;
        return ok(user.Role <= memberThreshold);
      }

      if (groupName === "role:fullmembers") {
        const memberThreshold = 400 as int;
        if (user.Role > memberThreshold) {
          return ok(false);
        }

        const tenantId1 = tenantId;
        const tenant = await db0.Tenants
          .Where((t) => t.Id === tenantId1)
          .FirstOrDefaultAsync();

        if (tenant === undefined) {
          return ok(false);
        }

        const settings = JSON.parse(tenant.SettingsJson) as Record<string, string>;
        const waitingPeriodStr = settings["waiting_period_threshold"];

        if (waitingPeriodStr === undefined || waitingPeriodStr === "0") {
          return ok(true);
        }

        const days = Number(waitingPeriodStr);
        const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        const duration = now - Number(user.DateJoined);
        return ok(duration >= days * 86400000);
      }

      if (groupName === "role:moderators") {
        const modThreshold = 300 as int;
        return ok(user.Role <= modThreshold);
      }

      if (groupName === "role:administrators") {
        const adminThreshold = 200 as int;
        return ok(user.Role <= adminThreshold);
      }

      if (groupName === "role:owners") {
        const ownerRole = 100 as int;
        return ok(user.Role === ownerRole);
      }

      if (groupName === "role:internet") {
        return ok(true);
      }

      if (groupName === "role:nobody") {
        return ok(false);
      }

      return ok(false);
    }

    // Custom group — check membership table
    const groupId1 = groupId;
    const userId1 = userId;

    const member = await db0.UserGroupMembers
      .Where((m) => m.UserGroupId === groupId1).Where((m) => m.UserId === userId1)
      .FirstOrDefaultAsync();

    return ok(member !== undefined);
  } finally {
    db.Dispose();
  }
};
