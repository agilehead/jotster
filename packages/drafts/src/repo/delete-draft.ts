import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteDraft = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  draftId: long
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const draftId0 = draftId;
    const draft = await db0.Drafts
      .Where((d) => d.TenantId === tenantId0).Where((d) => d.UserId === userId0).Where((d) => d.Id === draftId0)
      .FirstOrDefaultAsync();

    if (draft === undefined || draft === null) {
      return false;
    }

    db0.Drafts.Remove(draft);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
