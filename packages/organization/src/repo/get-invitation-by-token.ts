import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Invitation } from "@jotster/core/Jotster.Core.js";

export const getInvitationByToken = async (
  options: DbContextOptions,
  linkToken: string
): Promise<Invitation | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const linkToken0 = linkToken;

    const result = await db0.Invitations
      .Where((x) => x.LinkToken === linkToken0)
      .FirstOrDefaultAsync();

    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
