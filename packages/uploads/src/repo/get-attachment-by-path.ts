import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Attachment } from "@jotster/core/Jotster.Core.js";

export const getAttachmentByPath = async (
  options: DbContextOptions,
  tenantId: string,
  pathId: string
): Promise<Attachment | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const pathId0 = pathId;
    const result = await db0.Attachments
      .Where((a) => a.TenantId === tenantId0).Where((a) => a.PathId === pathId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
