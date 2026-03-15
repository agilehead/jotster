import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";

export const deactivateOrgDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<boolean, string>> => {
  // Validate owner role (role === 100)
  if (user.role !== 100) {
    return err("Only organization owners can deactivate the organization");
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;

    const tenant = await db0.Tenants.Where(
      (x) => x.Id === tenantId0,
    ).FirstOrDefaultAsync();

    if (tenant === undefined) {
      return err("Organization not found");
    }

    tenant.Active = 0 as int;
    tenant.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }

  // Emit realm event
  dispatchEventToTenant(user.tenantId, {
    type: "realm",
    op: "update",
    data: {
      property: "deactivated",
      value: true,
    },
  });

  return ok(true);
};
