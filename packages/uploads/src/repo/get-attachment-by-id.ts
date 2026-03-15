import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Attachment } from "@jotster/core/Jotster.Core.js";

export const getAttachmentById = async (
  options: DbContextOptions,
  tenantId: long,
  attachmentId: long,
): Promise<Attachment | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const attachmentId0 = attachmentId;
    const result = await db0.Attachments.Where((a) => a.TenantId === tenantId0)
      .Where((a) => a.Id === attachmentId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
