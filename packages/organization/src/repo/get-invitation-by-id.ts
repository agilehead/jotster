import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Invitation } from "@jotster/core/Jotster.Core.js";

export const getInvitationById = async (
  options: DbContextOptions,
  tenantId: long,
  invitationId: long,
): Promise<Invitation | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const invitationId0 = invitationId;

    const result = await db0.Invitations.Where((x) => x.TenantId === tenantId0)
      .Where((x) => x.Id === invitationId0)
      .FirstOrDefaultAsync();

    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
