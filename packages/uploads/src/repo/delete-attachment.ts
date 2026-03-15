import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteAttachment = async (
  options: DbContextOptions,
  tenantId: long,
  attachmentId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const attachmentId0 = attachmentId;
    const attachment = await db0.Attachments.Where(
      (a) => a.TenantId === tenantId0,
    )
      .Where((a) => a.Id === attachmentId0)
      .FirstOrDefaultAsync();

    if (attachment === undefined || attachment === null) {
      return false;
    }

    db0.Attachments.Remove(attachment);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
