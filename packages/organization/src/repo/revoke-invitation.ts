import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const revokeInvitation = async (
  options: DbContextOptions,
  tenantId: long,
  invitationId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const invitationId0 = invitationId;
    const status0 = "pending";

    const invitation = await db0.Invitations.Where(
      (x) => x.TenantId === tenantId0,
    )
      .Where((x) => x.Id === invitationId0)
      .Where((x) => x.Status === status0)
      .FirstOrDefaultAsync();

    if (invitation == null) {
      return false;
    }

    invitation.Status = "revoked";
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
