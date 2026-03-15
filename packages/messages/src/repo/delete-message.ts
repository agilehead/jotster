import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteMessage = async (
  options: DbContextOptions,
  tenantId: long,
  messageId: long
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const message = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id === messageId0)
      .FirstOrDefaultAsync();

    if (message === undefined || message === null) {
      return false;
    }

    db0.Messages.Remove(message);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
