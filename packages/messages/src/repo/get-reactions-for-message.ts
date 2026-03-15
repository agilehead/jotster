import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Reaction } from "@jotster/core/Jotster.Core.js";

export const getReactionsForMessage = async (
  options: DbContextOptions,
  tenantId: long,
  messageId: long,
): Promise<Reaction[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const result = await db0.Reactions.Where((r) => r.TenantId === tenantId0)
      .Where((r) => r.MessageId === messageId0)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
