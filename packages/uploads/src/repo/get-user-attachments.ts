import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Attachment } from "@jotster/core/Jotster.Core.js";

export const getUserAttachments = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<Attachment[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const result = await db0.Attachments.Where((a) => a.TenantId === tenantId0)
      .Where((a) => a.UserId === userId0)
      .OrderByDescending((a) => a.CreatedAt)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
