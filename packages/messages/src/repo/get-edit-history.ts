import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, MessageEditHistory } from "@jotster/core/Jotster.Core.js";

export const getEditHistory = async (
  options: DbContextOptions,
  tenantId: string,
  messageId: string
): Promise<MessageEditHistory[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;

    // Verify the message belongs to this tenant
    const message = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id === messageId0)
      .FirstOrDefaultAsync();

    if (message === undefined || message === null) {
      return [];
    }

    const result = await db0.MessageEditHistories
      .Where((h) => h.MessageId === messageId0)
      .OrderByDescending((h) => h.Timestamp)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
