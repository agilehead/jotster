import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Message } from "@jotster/core/Jotster.Core.js";

export const getMessage = async (
  options: DbContextOptions,
  tenantId: string,
  messageId: string
): Promise<Message | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id === messageId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
