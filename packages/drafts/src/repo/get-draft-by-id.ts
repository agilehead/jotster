import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Draft } from "@jotster/core/Jotster.Core.js";

export const getDraftById = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  draftId: long
): Promise<Draft | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const draftId0 = draftId;
    const result = await db0.Drafts
      .Where((d) => d.TenantId === tenantId0).Where((d) => d.UserId === userId0).Where((d) => d.Id === draftId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
